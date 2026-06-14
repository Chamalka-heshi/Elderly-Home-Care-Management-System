import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import {
  ChannelingSlot,
  SlotStatus,
} from '../channeling-slot/entities/channeling-slot.entity';
import { Patient } from '../patients/entities/patient.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  QueryAppointmentsDto,
} from './dto/appointment.dto';

const MEDICAL_SENSITIVE_FIELDS = [
  'medicalHistory',
  'allergies',
  'currentMedications',
  'chronicConditions',
] as const;

type SafePatient = Omit<Patient, (typeof MEDICAL_SENSITIVE_FIELDS)[number]>;

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(ChannelingSlot)
    private readonly slotRepo: Repository<ChannelingSlot>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(FamilyMember)
    private readonly familyRepo: Repository<FamilyMember>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  //Redacts sensitive information to satisfy data privacy requirements for administrative users
  private stripMedicalDetails(patient: Patient): SafePatient {
    const safe: any = { ...patient };
    for (const field of MEDICAL_SENSITIVE_FIELDS) {
      delete safe[field];
    }
    return safe as SafePatient;
  }

  //Encapsulates patient record security logic to allow centralized control over medical data visibility
  private buildSafeAppointment(appt: Appointment, includeFullMedical: boolean) {
    return {
      ...appt,
      patient: includeFullMedical
        ? appt.patient
        : this.stripMedicalDetails(appt.patient),
    };
  }

  //Calculates age at runtime to ensure clinicians have the most accurate patient context for treatment
  private computeAge(dateOfBirth: string | Date): number {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()))
      age--;
    return age;
  }

  //Initializes a pending appointment while enforcing slot capacity and preventing double bookings
  async createAppointment(
    userId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember)
      throw new NotFoundException('Family member profile not found');

    const slot = await this.slotRepo.findOne({ where: { id: dto.slotId } });
    if (!slot) throw new NotFoundException('Channeling slot not found');
    if (slot.status !== SlotStatus.ACTIVE)
      throw new BadRequestException(
        'This slot is not active / available for booking',
      );

    const today = new Date().toISOString().split('T')[0];
    if (slot.date < today)
      throw new BadRequestException('Cannot book a past slot');

    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId, familyMemberId: familyMember.id },
    });
    if (!patient)
      throw new ForbiddenException(
        'Patient not found or does not belong to your account',
      );
    if (!patient.isActive)
      throw new BadRequestException('Patient is not active');

    const duplicate = await this.appointmentRepo.findOne({
      where: [
        {
          slotId: dto.slotId,
          patientId: dto.patientId,
          status: AppointmentStatus.PAYMENT_PENDING,
        },
        {
          slotId: dto.slotId,
          patientId: dto.patientId,
          status: AppointmentStatus.PRESCRIPTION_PENDING,
        },
      ],
    });
    if (duplicate)
      throw new BadRequestException(
        'An appointment for this patient in this slot already exists',
      );

    const booked = await this.appointmentRepo.count({
      where: [
        { slotId: dto.slotId, status: AppointmentStatus.PAYMENT_PENDING },
        { slotId: dto.slotId, status: AppointmentStatus.PRESCRIPTION_PENDING },
      ],
    });
    if (booked >= slot.maxPatients)
      throw new BadRequestException('This slot is fully booked');

    const appointment = this.appointmentRepo.create({
      slotId: dto.slotId,
      patientId: dto.patientId,
      familyMemberId: familyMember.id,
      status: AppointmentStatus.PAYMENT_PENDING,
      notes: dto.notes ?? null,
    });

    return this.appointmentRepo.save(appointment);
  }

  //Retrieves historical and upcoming bookings for a specific family member
  async getMyAppointments(userId: string): Promise<Appointment[]> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!familyMember)
      throw new NotFoundException('Family member profile not found');

    return this.appointmentRepo.find({
      where: { familyMemberId: familyMember.id },
      relations: ['slot', 'slot.doctor', 'slot.doctor.user', 'patient'],
      order: { createdAt: 'DESC' },
    });
  }

  //Allows family members to release booked slots before the visit occurs
  async cancelMyAppointment(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!familyMember)
      throw new NotFoundException('Family member profile not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { id, familyMemberId: familyMember.id },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === AppointmentStatus.CANCELLED)
      throw new BadRequestException('Appointment is already cancelled');
    if (appointment.status === AppointmentStatus.COMPLETED)
      throw new BadRequestException('Cannot cancel a completed appointment');

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);
    return { message: 'Appointment cancelled successfully' };
  }

  //Provides doctors with a consolidated view of their clinical schedule
  async getDoctorAppointments(userId: string): Promise<any[]> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const appointments = await this.appointmentRepo
      .createQueryBuilder('appt')
      .innerJoinAndSelect('appt.slot', 'slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .innerJoinAndSelect('appt.patient', 'patient')
      .innerJoinAndSelect('appt.familyMember', 'fm')
      .innerJoinAndSelect('fm.user', 'fmUser')
      .where('slot.doctorId = :doctorId', { doctorId: doctor.id })
      .andWhere('appt.status IN (:...statuses)', {
        statuses: [
          AppointmentStatus.PRESCRIPTION_PENDING,
          AppointmentStatus.COMPLETED,
          AppointmentStatus.CANCELLED,
        ],
      })
      .orderBy('slot.date', 'DESC')
      .addOrderBy('slot.startTime', 'ASC')
      .getMany();

    return appointments.map((a) => {
      const safe = this.buildSafeAppointment(a, true) as any;
      if (safe.patient?.dateOfBirth) {
        safe.patient = {
          ...safe.patient,
          age: this.computeAge(safe.patient.dateOfBirth),
        };
      }
      return safe;
    });
  }

  //Enables clinicians to progress appointment states during the patient encounter
  async updateAppointmentStatusByDoctor(
    userId: string,
    id: string,
    dto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['slot'],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.slot.doctorId !== doctor.id)
      throw new ForbiddenException(
        'This appointment does not belong to your slots',
      );

    appointment.status = dto.status;
    if (dto.notes !== undefined) appointment.notes = dto.notes;
    return this.appointmentRepo.save(appointment);
  }

  //Surfaces all system-wide bookings for administrative oversight
  async getAllAppointments(query: QueryAppointmentsDto): Promise<any[]> {
    const qb = this.appointmentRepo
      .createQueryBuilder('appt')
      .innerJoinAndSelect('appt.slot', 'slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .innerJoinAndSelect('appt.patient', 'patient')
      .innerJoinAndSelect('appt.familyMember', 'fm')
      .innerJoinAndSelect('fm.user', 'fmUser')
      .orderBy('appt.createdAt', 'DESC');

    if (query.status)
      qb.andWhere('appt.status = :status', { status: query.status });
    if (query.patientId)
      qb.andWhere('appt.patientId = :patientId', {
        patientId: query.patientId,
      });
    if (query.doctorId)
      qb.andWhere('slot.doctorId = :doctorId', { doctorId: query.doctorId });

    const appointments = await qb.getMany();
    return appointments.map((a) => this.buildSafeAppointment(a, false));
  }

  //Grants admins manual control over appointment states for operational flexibility
  async adminUpdateStatus(
    id: string,
    dto: UpdateAppointmentStatusDto,
  ): Promise<{ message: string }> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    appointment.status = dto.status;
    if (dto.notes !== undefined) appointment.notes = dto.notes;
    await this.appointmentRepo.save(appointment);
    return { message: 'Appointment status updated' };
  }

  //Allows permanent removal of erroneous or obsolete appointment records
  async adminDelete(id: string): Promise<{ message: string }> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    await this.appointmentRepo.remove(appointment);
    return { message: 'Appointment deleted successfully' };
  }
}
