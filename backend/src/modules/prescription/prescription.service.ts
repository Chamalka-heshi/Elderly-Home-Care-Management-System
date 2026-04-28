import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';

import { Prescription, type PrescriptionStatus } from './entities/prescription.entity';
import { Doctor }                                from '../doctors/entities/doctor.entity';
import { FamilyMember }                          from '../family/entities/family-member.entity';
import { Patient }                               from '../patients/entities/patient.entity';
import { Appointment, AppointmentStatus }         from '../appointments/entities/appointment.entity';
import { CreatePrescriptionDto }                 from './dto/prescription.dto';
import { MailService }                           from '../mail/mail.service';

export interface PrescriptionListResult {
  data:  Prescription[];
  total: number;
  page:  number;
  limit: number;
}

export interface FamilyPrescriptionResult {
  data:  Prescription[];
  total: number;
}

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    @InjectRepository(Prescription)
    private readonly repo: Repository<Prescription>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepo: Repository<FamilyMember>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly mailService: MailService,
  ) {}

  // Internal Resolvers

  // Resolves the clinical professional's identifier from their system user account to ensure data is scoped correctly.
  private async resolveDoctorId(userId: string): Promise<string> {
    if (!userId) throw new ForbiddenException('User ID could not be resolved from token.');
    const doctor = await this.doctorRepo.findOne({
      where:     { user: { id: userId } },
      relations: ['user'],
    });
    if (!doctor) throw new ForbiddenException('No doctor profile found for this user.');
    return doctor.id;
  }

  // Retrieves the display name of the issuing doctor for use in automated communications and patient-facing records.
  private async resolveDoctorName(userId: string): Promise<string> {
    const doctor = await this.doctorRepo.findOne({
      where:     { user: { id: userId } },
      relations: ['user'],
    });
    return doctor?.user?.fullName ?? 'Your Doctor';
  }

  // Prescription Management

  // Orchestrates the creation of a new medical instruction, verifying appointment validity and triggering automated family notifications.
  async create(userId: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    const doctorId = await this.resolveDoctorId(userId);

    if (dto.appointmentId) {
      const appt = await this.appointmentRepo.findOne({
        where:     { id: dto.appointmentId },
        relations: ['slot'],
      });

      if (!appt) throw new NotFoundException(`Appointment ${dto.appointmentId} not found.`);
      if (appt.slot?.doctorId !== doctorId) throw new ForbiddenException('This appointment does not belong to your slots.');

      if (appt.prescriptionId) {
        throw new ConflictException('A prescription has already been created for this appointment.');
      }
      
      const existing = await this.repo.findOne({
        where: { appointmentId: dto.appointmentId },
      });
      if (existing) {
        throw new ConflictException('A prescription has already been created for this appointment.');
      }
    }

    const prescription = this.repo.create({
      doctorId,
      appointmentId: dto.appointmentId ?? null,
      patientId:     dto.patientId?.trim()  ?? null,
      patientName:   dto.patientName.trim(),
      patientAge:    dto.patientAge,
      diagnosis:     dto.diagnosis?.trim()  ?? null,
      notes:         dto.notes?.trim()      ?? null,
      issuedDate:    dto.issuedDate,
      validUntil:    dto.validUntil?.trim() ?? null,
      medicines:     dto.medicines,
      status:        'active',
    });
    const saved = await this.repo.save(prescription);

    if (dto.appointmentId) {
      await this.appointmentRepo.update(dto.appointmentId, {
        status:         AppointmentStatus.COMPLETED,
        prescriptionId: saved.id,
      });
    }

    // Dispatches a summary of the prescription to the associated family member for treatment transparency.
    this.sendPrescriptionEmail(saved, userId).catch((err) => {
      this.logger.error(
        `Failed to send prescription email for prescription ${saved.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return saved;
  }

  // Data Retrieval

  // Provides a paginated history of prescriptions issued by the professional, supporting clinical review and continuity of care.
  async findAll(
    userId:     string,
    status?:    PrescriptionStatus,
    patientId?: string,
    page        = 1,
    limit       = 50,
  ): Promise<PrescriptionListResult> {
    const doctorId = await this.resolveDoctorId(userId);

    const qb = this.repo
      .createQueryBuilder('rx')
      .where('rx.doctorId = :doctorId', { doctorId })
      .orderBy('rx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status)    qb.andWhere('rx.status = :status',       { status });
    if (patientId) qb.andWhere('rx.patientId = :patientId', { patientId });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // Aggregates all clinical instructions issued for patients managed by a specific family member for their dashboard view.
  async findForFamily(userId: string): Promise<FamilyPrescriptionResult> {
    if (!userId) throw new ForbiddenException('User ID could not be resolved from token.');

    const fm = await this.familyMemberRepo.findOne({
      where:     { user: { id: userId } },
      relations: ['patients'],
    });

    if (!fm) throw new ForbiddenException('No family member profile found for this user.');
    if (!fm.patients?.length) return { data: [], total: 0 };

    const patientIds = fm.patients.map((p) => p.id);

    const data = await this.repo
      .createQueryBuilder('rx')
      .leftJoinAndSelect('rx.doctor',      'doctor')
      .leftJoinAndSelect('doctor.user',    'doctorUser')
      .where('rx.patientId IN (:...patientIds)', { patientIds })
      .orderBy('rx.createdAt', 'DESC')
      .getMany();

    return { data, total: data.length };
  }

  // Returns a single prescription record for a clinical professional, verifying ownership before exposure.
  async findOne(id: string, userId: string): Promise<Prescription> {
    const doctorId = await this.resolveDoctorId(userId);
    const rx = await this.repo.findOne({ where: { id, doctorId } });
    if (!rx) throw new NotFoundException(`Prescription ${id} not found.`);
    return rx;
  }

  // Allows family members to access specific treatment instructions for their associated elderly relatives.
  async findOneForFamily(id: string, userId: string): Promise<Prescription> {
    if (!userId) throw new ForbiddenException('User ID could not be resolved from token.');

    const fm = await this.familyMemberRepo.findOne({
      where:     { user: { id: userId } },
      relations: ['patients'],
    });
    if (!fm) throw new ForbiddenException('No family member profile found for this user.');

    const patientIds = (fm.patients ?? []).map((p) => p.id);

    const rx = await this.repo
      .createQueryBuilder('rx')
      .leftJoinAndSelect('rx.doctor',   'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .where('rx.id = :id', { id })
      .andWhere('rx.patientId IN (:...patientIds)', { patientIds })
      .getOne();

    if (!rx) throw new NotFoundException(`Prescription ${id} not found.`);
    return rx;
  }

  // Status Transitions

  // Updates the treatment status to discontinued, indicating a clinical decision to stop the medication course.
  async discontinue(id: string, userId: string): Promise<Prescription> {
    const rx = await this.findOne(id, userId);
    if (rx.status === 'discontinued') {
      throw new BadRequestException('Prescription is already discontinued.');
    }
    rx.status = 'discontinued';
    return this.repo.save(rx);
  }

  // Marks a prescription as completed once the full medication cycle has been observed and recorded.
  async complete(id: string, userId: string): Promise<Prescription> {
    const rx = await this.findOne(id, userId);
    if (rx.status === 'completed') {
      throw new BadRequestException('Prescription is already completed.');
    }
    rx.status = 'completed';
    return this.repo.save(rx);
  }

  // Internal Logic

  // Orchestrates the delivery of clinical instruction summaries to verified family contacts via email.
  private async sendPrescriptionEmail(
    prescription: Prescription,
    doctorUserId: string,
  ): Promise<void> {
    if (!prescription.patientId) return;

    const patient = await this.patientRepo.findOne({
      where:     { id: prescription.patientId },
      relations: ['familyMember', 'familyMember.user'],
    });

    if (!patient?.familyMember?.user?.email) {
      this.logger.warn(
        `Prescription ${prescription.id}: no family member email found for patient ${prescription.patientId}`,
      );
      return;
    }

    const { fullName: familyMemberName, email } = patient.familyMember.user;
    const doctorName = await this.resolveDoctorName(doctorUserId);

    await this.mailService.sendPrescriptionNotification({
      to:               email,
      familyMemberName,
      patientName:      prescription.patientName,
      doctorName,
      issuedDate:       prescription.issuedDate,
      validUntil:       prescription.validUntil ?? undefined,
      diagnosis:        prescription.diagnosis  ?? undefined,
      notes:            prescription.notes      ?? undefined,
      medicines:        prescription.medicines,
    });

    this.logger.log(
      `Prescription email sent → ${email} (family member of patient ${prescription.patientName})`,
    );
  }
}