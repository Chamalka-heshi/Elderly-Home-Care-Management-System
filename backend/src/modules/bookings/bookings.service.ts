import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
  CarePlanSnapshot,
} from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CarePlan } from '../care-plan/entities/care-plan.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(FamilyMember)
    private readonly familyRepo: Repository<FamilyMember>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(CarePlan)
    private readonly carePlanRepo: Repository<CarePlan>,
  ) {}

  async createBooking(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember) throw new NotFoundException('Family member profile not found');

    const carePlan = await this.carePlanRepo.findOne({ where: { id: dto.carePlanId } });
    if (!carePlan) throw new NotFoundException('Care plan not found');
    if (!carePlan.isActive) throw new BadRequestException('Care plan is inactive');

    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId, familyMemberId: familyMember.id },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found or does not belong to your account');
    }

    const snapshot: CarePlanSnapshot = {
      name: carePlan.name,
      price: Number(carePlan.price),
      duration: carePlan.duration,
      durationUnit: carePlan.durationUnit,
    };

    const booking = this.bookingRepo.create({
      userId: familyMember.id,
      patientId: patient.id,
      carePlanId: carePlan.id,
      status: BookingStatus.PENDING_PAYMENT,
      carePlanSnapshot: snapshot,
    });

    return this.bookingRepo.save(booking);
  }

  async getMyBookings(userId: string): Promise<Booking[]> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember) throw new NotFoundException('Family member profile not found');

    return this.bookingRepo.find({
      where: { userId: familyMember.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepo.find({
      order: { createdAt: 'DESC' },
    });
  }
}
