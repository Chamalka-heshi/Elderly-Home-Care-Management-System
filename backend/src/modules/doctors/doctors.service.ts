/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { Prescription } from '../prescription/entities/prescription.entity';
import { ChannelingSlot, SlotStatus } from '../channeling-slot/entities/channeling-slot.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';

// ── Dashboard response type ──────────────────────────────────────────────────

export interface DashboardRecentPatient {
  id: string;          // prescription id (stable key for the row)
  name: string;
  age: number;
  bloodGroup: string | null;
  diagnosis: string | null;
  status: 'Active' | 'Completed' | 'Discontinued';
  prescriptionDate: string;
}

export interface DoctorDashboardStats {
  myPatientsCount: number;
  todaysAppointmentsCount: number;
  activePrescriptionsCount: number;
  pendingAppointmentsCount: number;
  recentPatients: DashboardRecentPatient[];
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Prescription)
    private prescriptionRepository: Repository<Prescription>,

    @InjectRepository(ChannelingSlot)
    private channelingSlotRepository: Repository<ChannelingSlot>,

    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    private usersService: UsersService,
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { email, password, fullName, contactNumber, ...doctorData } =
      createDoctorDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // password is injected by auth.service (auto-generated); never comes from the request body
    if (!password) {
      throw new BadRequestException('Password is required for account creation');
    }

    const user = await this.usersService.create(
      email,
      password,
      UserRole.DOCTOR,
      fullName,
      contactNumber,
    );

    const doctor = this.doctorRepository.create({
      user,
      specialization: doctorData.specialization,
      licenseNumber: doctorData.licenseNumber,
      qualification: doctorData.qualification || 'MBBS',
      experienceYears: doctorData.experienceYears,
      hospitalAffiliation: doctorData.hospitalAffiliation,
      consultationFee: doctorData.consultationFee,
      availableDays: doctorData.availableDays,
      availableTimeStart: doctorData.availableTimeStart,
      availableTimeEnd: doctorData.availableTimeEnd,
    });

    return this.doctorRepository.save(doctor);
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['user'],
      order: { user: { createdAt: 'DESC' } },
    });
  }

  async findAllActive(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: { user: { isActive: true } },
      relations: ['user'],
      order: { user: { createdAt: 'DESC' } },
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor> {
    // Step 1: resolve doctor id from user id
    const doctorRef = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
      select: { id: true },
    });

    if (!doctorRef) {
      throw new NotFoundException('Doctor not found');
    }

    // Step 2: fetch full doctor by its own primary key with only safe user fields
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorRef.id },
      relations: ['user'],
      select: {
        id: true,
        specialization: true,
        licenseNumber: true,
        qualification: true,
        experienceYears: true,
        hospitalAffiliation: true,
        consultationFee: true,
        availableDays: true,
        availableTimeStart: true,
        availableTimeEnd: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          contactNumber: true,
          isActive: true,
          createdAt: true,
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────

  /**
   * Returns aggregated stats for the doctor's dashboard home page.
   * All queries are scoped to the authenticated doctor's own data.
   */
  async getDashboardStats(userId: string): Promise<DoctorDashboardStats> {
    // 1. Resolve doctor row from users.id
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    const doctorId = doctor.id;
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 2. Unique patients count  — distinct patientName values across all prescriptions
    const uniquePatientsResult = await this.prescriptionRepository
      .createQueryBuilder('rx')
      .select('COUNT(DISTINCT rx.patient_name)', 'count')
      .where('rx.doctor_id = :doctorId', { doctorId })
      .getRawOne<{ count: string }>();

    const myPatientsCount = parseInt(uniquePatientsResult?.count ?? '0', 10);

    // 3. Today's appointments — channeling slots with date = today, status active/pending
    const todaysAppointmentsCount = await this.channelingSlotRepository.count({
      where: {
        doctorId,
        date: todayStr,
        status: SlotStatus.ACTIVE,
      },
    });

    // 4. Active prescriptions
    const activePrescriptionsCount = await this.prescriptionRepository.count({
      where: { doctorId, status: 'active' },
    });

    // 5. Pending channeling slots (doctor hasn't accepted yet)
    const pendingAppointmentsCount = await this.channelingSlotRepository.count({
      where: { doctorId, status: SlotStatus.PENDING },
    });

    // 6. Recent patients — last 10 confirmed/pending appointments ordered by slot date DESC
    const recentAppointments = await this.appointmentRepository
      .createQueryBuilder('appt')
      .innerJoinAndSelect('appt.slot', 'slot')
      .innerJoinAndSelect('appt.patient', 'patient')
      .where('slot.doctorId = :doctorId', { doctorId })
      .andWhere('appt.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
      })
      .orderBy('slot.date', 'DESC')
      .addOrderBy('slot.startTime', 'ASC')
      .take(10)
      .getMany();

    const recentPatients: DashboardRecentPatient[] = recentAppointments.map((appt) => ({
      id: appt.id,
      name: appt.patient.fullName,
      age: this.computeAge(appt.patient.dateOfBirth),
      bloodGroup: appt.patient.bloodGroup ?? null,
      diagnosis: null,
      status: appt.status === AppointmentStatus.CONFIRMED ? 'Active' : 'Active',
      prescriptionDate: appt.slot?.date ?? new Date().toISOString().split('T')[0],
    }));

    return {
      myPatientsCount,
      todaysAppointmentsCount,
      activePrescriptionsCount,
      pendingAppointmentsCount,
      recentPatients,
    };
  }

  /** Compute age in whole years from dateOfBirth */
  private computeAge(dateOfBirth: Date | string): number {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async updateProfileByUserId(userId: string, updateData: UpdateDoctorProfileDto) {
    const doctor = await this.findByUserId(userId);

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    // 1. Update base user fields directly via UsersService
    if (updateData.fullName || updateData.contactNumber) {
      await this.usersService.update(userId, {
        ...(updateData.fullName && { fullName: updateData.fullName }),
        ...(updateData.contactNumber && {
          contactNumber: updateData.contactNumber,
        }),
      });
    }

    // 2. Update doctor-specific fields
    if (updateData.specialization) doctor.specialization = updateData.specialization;
    if (updateData.licenseNumber) doctor.licenseNumber = updateData.licenseNumber;
    if (updateData.qualification !== undefined) doctor.qualification = updateData.qualification;
    if (updateData.experienceYears !== undefined) doctor.experienceYears = updateData.experienceYears;

    const updatedDoctor = await this.doctorRepository.save(doctor);

    // 3. Fetch updated user separately for the response
    const updatedUser = await this.usersService.findById(userId);

    if (!updatedUser) {
      throw new NotFoundException('User not found after profile update');
    }

    return {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      contactNumber: updatedUser.contactNumber,
      profile: updatedDoctor,
    };
  }

  async deactivate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.deactivateUser(doctor.user.id);
  }

  async activate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.activateUser(doctor.user.id);
  }

  async setAvailability(
    userId: string,
    availableDays: string[],
    availableTimeStart: string,
    availableTimeEnd: string,
  ): Promise<Doctor> {
    const doctor = await this.findByUserId(userId);
    if (!doctor) throw new NotFoundException('Doctor not found');

    doctor.availableDays = availableDays;
    doctor.availableTimeStart = availableTimeStart;
    doctor.availableTimeEnd = availableTimeEnd;

    return this.doctorRepository.save(doctor);
  }
}