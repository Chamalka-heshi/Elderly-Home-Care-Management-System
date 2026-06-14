import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Doctor } from './entities/doctor.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { Prescription } from '../prescription/entities/prescription.entity';
import {
  ChannelingSlot,
  SlotStatus,
} from '../channeling-slot/entities/channeling-slot.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

export interface DashboardRecentPatient {
  id: string;
  name: string;
  age: number;
  bloodGroup: string | null;
  diagnosis: string | null;
  status: 'Prescription Pending';
  appointmentStatus: string;
  slotDate: string;
  prescriptionDate: string;
}

export interface DoctorDashboardStats {
  myPatientsCount: number;
  todaysAppointmentsCount: number;
  activePrescriptionsCount: number;
  pendingAppointmentsCount: number;
  recentPatients: DashboardRecentPatient[];
}

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

  //Orchestrates the dual creation of a core user identity and a clinical profile to ensure record synchronization
  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { email, password, fullName, contactNumber, ...doctorData } =
      createDoctorDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new BadRequestException('Email already registered');

    if (doctorData.nic) {
      const existingNic = await this.doctorRepository.findOne({
        where: { nic: doctorData.nic },
      });
      if (existingNic) throw new BadRequestException('NIC already registered');
    }

    if (!password)
      throw new BadRequestException(
        'Password is required for account creation',
      );

    const user = await this.usersService.create(
      email,
      password,
      UserRole.DOCTOR,
      fullName,
      contactNumber,
    );

    const doctor = this.doctorRepository.create({
      user,
      nic: doctorData.nic,
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

  //Suspends the doctor's platform access by disabling their core user account
  async deactivate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.deactivateUser(doctor.user.id);
  }

  //Restores the doctor's system access to resume clinical operations and scheduling
  async activate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.activateUser(doctor.user.id);
  }

  //Returns all registered doctors with associated users for administrative oversight
  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['user'],
      order: { user: { createdAt: 'DESC' } },
    });
  }

  //Retrieves granular details for a specific doctor to support profile views and management
  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  //Resolves the clinical profile for a specific system user to enforce role-based access
  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
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
        nic: true,
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

    if (!doctor) throw new NotFoundException('Doctor not found');

    return doctor;
  }

  //Aggregates clinical and operational metrics to provide an operational snapshot for the doctor
  async getDashboardStats(userId: string): Promise<DoctorDashboardStats> {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const doctorId = doctor.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const uniquePatientsResult = await this.appointmentRepository
      .createQueryBuilder('appt')
      .innerJoin('appt.slot', 'slot')
      .select('COUNT(DISTINCT appt.patient_id)', 'count')
      .where('slot.doctorId = :doctorId', { doctorId })
      .getRawOne<{ count: string }>();

    const myPatientsCount = parseInt(uniquePatientsResult?.count ?? '0', 10);

    const todaysAppointmentsCount = await this.channelingSlotRepository.count({
      where: {
        doctorId,
        date: todayStr,
        status: SlotStatus.ACTIVE,
      },
    });

    const activePrescriptionsCount = await this.prescriptionRepository.count({
      where: { doctorId, status: 'active' },
    });

    const pendingAppointmentsCount = await this.channelingSlotRepository.count({
      where: { doctorId, status: SlotStatus.PENDING },
    });

    const recentAppointments = await this.appointmentRepository
      .createQueryBuilder('appt')
      .innerJoinAndSelect('appt.slot', 'slot')
      .innerJoinAndSelect('appt.patient', 'patient')
      .where('slot.doctorId = :doctorId', { doctorId })
      .andWhere('appt.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PRESCRIPTION_PENDING],
      })
      .orderBy('slot.date', 'DESC')
      .addOrderBy('slot.startTime', 'ASC')
      .take(10)
      .getMany();

    const recentPatients: DashboardRecentPatient[] = recentAppointments.map(
      (appt) => {
        const slotDate =
          appt.slot?.date ?? new Date().toISOString().split('T')[0];
        return {
          id: appt.id,
          name: appt.patient.fullName,
          age: this.computeAge(appt.patient.dateOfBirth),
          bloodGroup: appt.patient.bloodGroup ?? null,
          diagnosis: null,
          status: 'Prescription Pending',
          appointmentStatus: appt.status,
          slotDate,
          prescriptionDate: slotDate,
        };
      },
    );

    return {
      myPatientsCount,
      todaysAppointmentsCount,
      activePrescriptionsCount,
      pendingAppointmentsCount,
      recentPatients,
    };
  }

  //Calculates chronological age to provide essential clinical context during patient reviews
  private computeAge(dateOfBirth: Date | string): number {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()))
      age--;
    return age;
  }

  //Synchronizes profile updates across core and clinical records to maintain data integrity
  async updateProfileByUserId(
    userId: string,
    updateData: UpdateDoctorProfileDto,
  ) {
    const doctor = await this.findByUserId(userId);
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    if (updateData.fullName || updateData.contactNumber) {
      await this.usersService.update(userId, {
        ...(updateData.fullName && { fullName: updateData.fullName }),
        ...(updateData.contactNumber && {
          contactNumber: updateData.contactNumber,
        }),
      });
    }

    if (updateData.specialization)
      doctor.specialization = updateData.specialization;
    if (updateData.licenseNumber)
      doctor.licenseNumber = updateData.licenseNumber;
    if (updateData.qualification !== undefined)
      doctor.qualification = updateData.qualification;
    if (updateData.experienceYears !== undefined)
      doctor.experienceYears = updateData.experienceYears;

    const updatedDoctor = await this.doctorRepository.save(doctor);
    const updatedUser = await this.usersService.findById(userId);

    if (!updatedUser)
      throw new NotFoundException('User not found after profile update');

    return {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      contactNumber: updatedUser.contactNumber,
      profile: updatedDoctor,
    };
  }

  //Updates recurring availability preferences to assist with automated slot proposals
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
