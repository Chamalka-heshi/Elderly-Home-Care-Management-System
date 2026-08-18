import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Prescription,
  type PrescriptionStatus,
} from './entities/prescription.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import { MailService } from '../mail/mail.service';
import { toColomboDateKey } from '../../common/utils/colombo-time';

export interface PrescriptionListResult {
  data: Prescription[];
  total: number;
  page: number;
  limit: number;
}

export interface FamilyPrescriptionResult {
  data: Prescription[];
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
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly mailService: MailService,
  ) {}

  //Resolves the clinical professional's identifier from their system user account to ensure data is scoped correctly
  private async resolveDoctorId(userId: string): Promise<string> {
    if (!userId)
      throw new ForbiddenException('User ID could not be resolved from token.');
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!doctor)
      throw new ForbiddenException('No doctor profile found for this user.');
    return doctor.id;
  }

  //Retrieves the display name of the issuing doctor for use in automated communications and records
  private async resolveDoctorName(userId: string): Promise<string> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    return doctor?.user?.fullName ?? 'Your Doctor';
  }

  // Determine whether the patient currently has an active, valid care plan that grants access to clinical notes.
  private async patientHasActiveCarePlan(patientId?: string | null): Promise<boolean> {
    if (!patientId) return false;

    // Find bookings for this patient that are marked ACTIVE
    const activeBookings = await this.bookingRepo.find({
      where: { patientId, status: BookingStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
    });

    if (!activeBookings?.length) return false;

    const now = new Date();
    for (const b of activeBookings) {
      const snapshot: any = (b as any).carePlanSnapshot ?? null;
      // Use updatedAt as the activation timestamp when booking status changed to ACTIVE
      const activatedAt = b.updatedAt ?? b.createdAt ?? new Date();

      // If care-plan snapshot does not include duration info, treat ACTIVE booking as valid
      if (!snapshot || !snapshot.duration) return true;

      const expiry = new Date(activatedAt);
      if ((snapshot.durationUnit ?? 'days') === 'months') {
        expiry.setMonth(expiry.getMonth() + Number(snapshot.duration));
      } else {
        expiry.setDate(expiry.getDate() + Number(snapshot.duration));
      }

      if (now <= expiry) return true;
    }

    return false;
  }

  //When a patient already has an active prescription, clinicians can continue the same course without re-prescribing medicines that are already active.
  private async filterContinuingMedicines(
    patientId: string | null | undefined,
    medicines: CreatePrescriptionDto['medicines'],
  ): Promise<CreatePrescriptionDto['medicines']> {
    if (!patientId || !medicines?.length) return medicines ?? [];

    const activeRx = await this.repo.find({
      where: { patientId, status: 'active' },
    });

    const activeKeys = new Set(
      activeRx.flatMap((rx) =>
        (rx.medicines ?? []).map((med) => {
          const name = String(med.medicineName ?? '').trim().toLowerCase();
          const dosage = String(med.dosage ?? '').trim().toLowerCase();
          return `${name}::${dosage}`;
        }),
      ),
    );

    return medicines.filter((med) => {
      const name = String(med.medicineName ?? '').trim().toLowerCase();
      const dosage = String(med.dosage ?? '').trim().toLowerCase();
      const key = `${name}::${dosage}`;
      return !activeKeys.has(key) || !name || !dosage;
    });
  }

  //Orchestrates the creation of a medical instruction, verifying appointment validity and triggering family notifications
  async create(
    userId: string,
    dto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    const doctorId = await this.resolveDoctorId(userId);

    if (dto.appointmentId) {
      const appt = await this.appointmentRepo.findOne({
        where: { id: dto.appointmentId },
        relations: ['slot'],
      });

      if (!appt)
        throw new NotFoundException(
          `Appointment ${dto.appointmentId} not found.`,
        );
      if (appt.slot?.doctorId !== doctorId)
        throw new ForbiddenException(
          'This appointment does not belong to your slots.',
        );
    }

    // Enforce Clinical Notes access: notes are only allowed for patients with an active, valid care plan.
    if (dto.notes?.trim()) {
      const hasPlan = await this.patientHasActiveCarePlan(dto.patientId?.trim() ?? null);
      if (!hasPlan) {
        throw new BadRequestException(
          'Clinical notes are available only for patients with an active care plan.',
        );
      }
    }

    const filteredMedicines = await this.filterContinuingMedicines(
      dto.patientId?.trim() ?? null,
      dto.medicines,
    );

    const prescription = this.repo.create({
      doctorId,
      appointmentId: dto.appointmentId ?? null,
      patientId: dto.patientId?.trim() ?? null,
      patientName: dto.patientName.trim(),
      patientAge: dto.patientAge,
      diagnosis: dto.diagnosis?.trim() ?? null,
      notes: dto.notes?.trim() ?? null,
      issuedDate: dto.issuedDate,
      validUntil: dto.validUntil?.trim() ?? null,
      medicines: filteredMedicines,
      status: 'active',
    });
    const saved = await this.repo.save(prescription);

    if (dto.appointmentId) {
      await this.appointmentRepo.update(dto.appointmentId, {
        status: AppointmentStatus.COMPLETED,
        prescriptionId: saved.id,
      });
    }

    this.sendPrescriptionEmail(saved, userId).catch((err) => {
      this.logger.error(
        `Failed to send prescription email for prescription ${saved.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return saved;
  }

  //Auto-expires active prescriptions whose validUntil date has passed to maintain clinical record accuracy
  async autoExpireActive(): Promise<number> {
    const today = toColomboDateKey();
    const result = await this.repo
      .createQueryBuilder()
      .update(Prescription)
      .set({ status: 'completed' })
      .where('status = :status', { status: 'active' })
      .andWhere('"valid_until" IS NOT NULL')
      .andWhere('"valid_until" < :today', { today })
      .execute();
    return result.affected ?? 0;
  }

  //Provides a paginated history of prescriptions issued by the professional to support continuity of care
  async findAll(
    userId: string,
    status?: PrescriptionStatus,
    patientId?: string,
    page = 1,
    limit = 50,
  ): Promise<PrescriptionListResult> {
    const doctorId = await this.resolveDoctorId(userId);

    await this.autoExpireActive();

    const qb = this.repo
      .createQueryBuilder('rx')
      .where('rx.doctorId = :doctorId', { doctorId })
      .orderBy('rx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('rx.status = :status', { status });
    if (patientId) qb.andWhere('rx.patientId = :patientId', { patientId });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  //Returns all prescriptions for a given patient to assist clinical professionals in treatment planning
  async findForPatient(
    patientId: string,
    userId: string,
  ): Promise<Prescription[]> {
    await this.resolveDoctorId(userId);
    await this.autoExpireActive();
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
      relations: ['doctor', 'doctor.user'],
    });
  }

  //Aggregates clinical instructions for patients managed by a family member for their dashboard view
  async findForFamily(userId: string): Promise<FamilyPrescriptionResult> {
    if (!userId)
      throw new ForbiddenException('User ID could not be resolved from token.');

    const fm = await this.familyMemberRepo.findOne({
      where: { user: { id: userId } },
      relations: ['patients'],
    });

    if (!fm)
      throw new ForbiddenException(
        'No family member profile found for this user.',
      );
    if (!fm.patients?.length) return { data: [], total: 0 };

    await this.autoExpireActive();

    const patientIds = fm.patients.map((p) => p.id);

    const data = await this.repo
      .createQueryBuilder('rx')
      .leftJoinAndSelect('rx.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .where('rx.patientId IN (:...patientIds)', { patientIds })
      .orderBy('rx.createdAt', 'DESC')
      .getMany();

    return { data, total: data.length };
  }

  //Returns a specific prescription record after verifying clinical ownership to ensure data security
  async findOne(id: string, userId: string): Promise<Prescription> {
    const doctorId = await this.resolveDoctorId(userId);
    const rx = await this.repo.findOne({ where: { id, doctorId } });
    if (!rx) throw new NotFoundException(`Prescription ${id} not found.`);
    return rx;
  }

  //Allows family members to access treatment instructions for their elderly relatives while enforcing ownership
  async findOneForFamily(id: string, userId: string): Promise<Prescription> {
    if (!userId)
      throw new ForbiddenException('User ID could not be resolved from token.');

    const fm = await this.familyMemberRepo.findOne({
      where: { user: { id: userId } },
      relations: ['patients'],
    });
    if (!fm)
      throw new ForbiddenException(
        'No family member profile found for this user.',
      );

    await this.autoExpireActive();

    const patientIds = (fm.patients ?? []).map((p) => p.id);

    const rx = await this.repo
      .createQueryBuilder('rx')
      .leftJoinAndSelect('rx.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .where('rx.id = :id', { id })
      .andWhere('rx.patientId IN (:...patientIds)', { patientIds })
      .getOne();

    if (!rx) throw new NotFoundException(`Prescription ${id} not found.`);
    return rx;
  }

  //Updates the treatment status to discontinued to record a clinical decision to stop medication
  async discontinue(id: string, userId: string): Promise<Prescription> {
    const rx = await this.findOne(id, userId);
    if (rx.status === 'discontinued') {
      throw new BadRequestException('Prescription is already discontinued.');
    }
    rx.status = 'discontinued';
    return this.repo.save(rx);
  }

  //Marks a prescription as completed once the full medication cycle has been observed
  async complete(id: string, userId: string): Promise<Prescription> {
    const rx = await this.findOne(id, userId);
    if (rx.status === 'completed') {
      throw new BadRequestException('Prescription is already completed.');
    }
    rx.status = 'completed';
    return this.repo.save(rx);
  }

  //Orchestrates the delivery of clinical instruction summaries to verified family contacts via email
  private async sendPrescriptionEmail(
    prescription: Prescription,
    doctorUserId: string,
  ): Promise<void> {
    if (!prescription.patientId) return;

    const patient = await this.patientRepo.findOne({
      where: { id: prescription.patientId },
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

    const activePrescriptions = await this.repo.find({
      where: { patientId: prescription.patientId, status: 'active' },
      order: { createdAt: 'DESC' },
    });

    await this.mailService.sendPrescriptionNotification({
      to: email,
      familyMemberName,
      patientName: prescription.patientName,
      doctorName,
      prescriptions: activePrescriptions.map((rx) => ({
        issuedDate: rx.issuedDate,
        validUntil: rx.validUntil ?? undefined,
        diagnosis: rx.diagnosis ?? undefined,
        notes: rx.notes ?? undefined,
        medicines: rx.medicines,
      })),
    });

    this.logger.log(
      `Prescription email sent → ${email} (family member of patient ${prescription.patientName})`,
    );
  }
}