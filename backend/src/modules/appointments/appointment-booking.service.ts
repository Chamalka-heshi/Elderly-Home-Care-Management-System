import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentBooking, AppointmentBookingStatus } from './entities/appointment-booking.entity';
import { CreateAppointmentBookingDto } from './dto/create-appointment-booking.dto';
import { Patient } from '../patients/entities/patient.entity';
import { FamilyMember } from '../family/entities/family-member.entity';

@Injectable()
export class AppointmentBookingService {
  constructor(
    @InjectRepository(AppointmentBooking)
    private readonly bookingsRepo: Repository<AppointmentBooking>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(FamilyMember)
    private readonly familyRepo: Repository<FamilyMember>,
  ) {}

  async create(userId: string, dto: CreateAppointmentBookingDto) {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember) throw new NotFoundException('Family member profile not found');

    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId, familyMemberId: familyMember.id },
    });
    if (!patient)
      throw new ForbiddenException('Patient not found or does not belong to your account');
    if (!patient.isActive) throw new BadRequestException('Patient is not active');

    const appointmentDate = dto.appointmentDate.split('T')[0];

    const booking = this.bookingsRepo.create({
      userId,
      patientId: dto.patientId,
      doctorId: dto.doctorId ?? null,
      caregiverId: dto.caregiverId ?? null,
      appointmentDate,
      appointmentTime: dto.appointmentTime,
      status: AppointmentBookingStatus.PENDING_PAYMENT,
    });

    const appointment = await this.bookingsRepo.save(booking);
    return {
      message: 'Appointment created successfully',
      appointment,
    };
  }

  async getMy(userId: string) {
    return this.bookingsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAll() {
    return this.bookingsRepo.find({
      order: { createdAt: 'DESC' },
    });
  }
}

