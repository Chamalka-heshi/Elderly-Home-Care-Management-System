import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';

import { ChannelingSlot, SlotStatus } from './entities/channeling-slot.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import {
  CreateChannelingSlotDto,
  UpdateChannelingSlotDto,
  UpdateDoctorSlotFeeDto,
} from './dto/channeling-slot.dto';
import { toColomboDateKey } from '../../common/utils/colombo-time';

// Utility Helpers

// Converts time strings into total minutes to facilitate precise overlap detection and duration calculations.
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Calculates the UTC Monday of a given date's week to define the boundaries for weekly slot quotas.
function weekStart(dateStr: string): Date {
  const d = new Date(dateStr);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

@Injectable()
export class ChannelingSlotService {
  constructor(
    @InjectRepository(ChannelingSlot)
    private readonly slotRepo: Repository<ChannelingSlot>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  //Validates doctor activity, scheduling quotas, and time overlaps before proposing a new consultation window
  async create(dto: CreateChannelingSlotDto): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
      relations: ['user'],
    });

    if (!doctor) throw new NotFoundException('Doctor not found');
    if (doctor.user && doctor.user.isActive === false)
      throw new BadRequestException('Doctor is not active');

    const today = toColomboDateKey();
    if (dto.date < today)
      throw new BadRequestException('Slot date must be today or in the future');

    if (toMinutes(dto.startTime) >= toMinutes(dto.endTime))
      throw new BadRequestException('startTime must be before endTime');

    const mon = weekStart(dto.date);
    const sun = new Date(mon);
    sun.setUTCDate(sun.getUTCDate() + 6);

    const monStr = toColomboDateKey(mon);
    const sunStr = toColomboDateKey(sun);

    const slotsThisWeek = await this.slotRepo.find({
      where: {
        doctorId: dto.doctorId,
        status: In([SlotStatus.ACTIVE, SlotStatus.PENDING]),
        date: Between(monStr, sunStr) as any,
      },
      select: ['date'],
    });

    const uniqueDays = new Set(slotsThisWeek.map((s) => s.date));
    uniqueDays.add(dto.date);

    if (uniqueDays.size > 5)
      throw new ConflictException(
        'Doctor already has slots on 5 days this week (maximum allowed)',
      );

    const existing = await this.slotRepo.find({
      where: {
        doctorId: dto.doctorId,
        date: dto.date,
        status: In([SlotStatus.ACTIVE, SlotStatus.PENDING]),
      },
    });

    const newStart = toMinutes(dto.startTime);
    const newEnd = toMinutes(dto.endTime);

    for (const slot of existing) {
      const exStart = toMinutes(slot.startTime);
      const exEnd = toMinutes(slot.endTime);
      if (newStart < exEnd && newEnd > exStart) {
        throw new ConflictException(
          `Time overlaps with existing slot ${slot.startTime}–${slot.endTime}`,
        );
      }
    }

    const slot = this.slotRepo.create({
      ...dto,
      status: SlotStatus.PENDING,
      consultationFee: doctor.consultationFee ?? null,
    });

    return this.slotRepo.save(slot);
  }

  //Moves a proposed slot into the active pool to signal clinician availability for patient bookings
  async acceptSlot(id: string, userId: string): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const slot = await this.slotRepo.findOne({
      where: { id, doctorId: doctor.id },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status !== SlotStatus.PENDING)
      throw new BadRequestException('Only pending slots can be accepted');

    slot.status = SlotStatus.ACTIVE;
    return this.slotRepo.save(slot);
  }

  //Declines a proposed slot to indicate the clinician is unavailable for the system-generated window
  async rejectSlot(id: string, userId: string): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const slot = await this.slotRepo.findOne({
      where: { id, doctorId: doctor.id },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status !== SlotStatus.PENDING)
      throw new BadRequestException('Only pending slots can be rejected');

    slot.status = SlotStatus.REJECTED;
    return this.slotRepo.save(slot);
  }

  //Permits doctors to override their base fee for specific sessions based on clinical complexity
  async updateDoctorSlotFee(
    slotId: string,
    userId: string,
    dto: UpdateDoctorSlotFeeDto,
  ): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const slot = await this.slotRepo.findOne({
      where: { id: slotId, doctorId: doctor.id },
    });
    if (!slot)
      throw new NotFoundException(
        'Slot not found or does not belong to this doctor',
      );

    slot.consultationFee = dto.consultationFee;
    return this.slotRepo.save(slot);
  }

  //Marks active slots as completed once their end time is reached to maintain system accuracy
  async autoCompletePassedSlots(): Promise<void> {
    // Slot times are stored in Asia/Colombo (IST+5:30). We must compare them against
    // the current time expressed in that same timezone, not UTC.

    // 1. Repair any slots prematurely marked as completed before their end_time has passed
    await this.slotRepo.query(`
      UPDATE channeling_slots
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'completed'
      AND (
        "date"::date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
        OR (
          "date"::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
          AND end_time > TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo', 'HH24:MI')
        )
      )
    `);

    // 2. Repair any appointments prematurely cancelled before their slot's end_time has passed
    await this.slotRepo.query(`
      UPDATE appointments
      SET status = 'prescription_pending', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'cancelled'
      AND prescription_id IS NULL
      AND slot_id IN (
        SELECT id FROM channeling_slots
        WHERE status = 'active'
        AND (
          "date"::date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
          OR (
            "date"::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
            AND end_time > TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo', 'HH24:MI')
          )
        )
      )
    `);

    // 3. Cancel prescription_pending appointments whose slot end_time has passed
    await this.slotRepo.query(`
      UPDATE appointments
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'prescription_pending'
      AND slot_id IN (
        SELECT id FROM channeling_slots
        WHERE "date"::date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
        OR (
          "date"::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
          AND end_time <= TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo', 'HH24:MI')
        )
      )
    `);

    // 4. Mark active slots as completed once their end_time has passed
    await this.slotRepo.query(`
      UPDATE channeling_slots
      SET    status = 'completed'
      WHERE  status = 'active'
      AND (
        "date"::date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
        OR (
          "date"::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
          AND end_time <= TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo', 'HH24:MI')
        )
      )
    `);
  }

  //Retrieves all platform slots for administrative oversight and operational reporting
  async findAll(): Promise<{ slots: ChannelingSlot[]; total: number }> {
    await this.autoCompletePassedSlots();

    const [slots, total] = await this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.startTime', 'ASC')
      .getManyAndCount();

    return { slots, total };
  }

  //Returns granular details for a specific slot to support targeted management actions
  async findOne(id: string): Promise<ChannelingSlot> {
    const slot = await this.slotRepo.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!slot) throw new NotFoundException('Channeling slot not found');
    return slot;
  }

  //Updates the details of a specific slot, applying structural changes without affecting status unless specified
  async update(
    id: string,
    dto: UpdateChannelingSlotDto,
  ): Promise<ChannelingSlot> {
    const slot = await this.findOne(id);
    if (slot.status !== SlotStatus.PENDING) {
      throw new BadRequestException(
        'Channeling slots can only be edited before doctor approval (when pending)',
      );
    }

    if (dto.date !== undefined) slot.date = dto.date;
    if (dto.startTime !== undefined) slot.startTime = dto.startTime;
    if (dto.endTime !== undefined) slot.endTime = dto.endTime;
    if (dto.bookingCutoffMinutes !== undefined)
      slot.bookingCutoffMinutes = dto.bookingCutoffMinutes;
    if (dto.maxPatients !== undefined) slot.maxPatients = dto.maxPatients;
    if (dto.status !== undefined) slot.status = dto.status;
    if (dto.notes !== undefined) slot.notes = dto.notes;
    if (dto.careHomeFee !== undefined) slot.careHomeFee = dto.careHomeFee;

    return this.slotRepo.save(slot);
  }

  //Invalidates a proposed slot before doctor approval or during emergencies
  async cancel(id: string): Promise<{ message: string }> {
    const slot = await this.findOne(id);
    if (slot.status !== SlotStatus.PENDING) {
      throw new BadRequestException(
        'Channeling slots can only be cancelled before doctor approval (when pending)',
      );
    }
    slot.status = SlotStatus.CANCELLED;
    await this.slotRepo.save(slot);
    return { message: 'Channeling slot cancelled successfully' };
  }

  //Permanently deletes erroneous slot records before any patient interactions occur
  async remove(id: string): Promise<{ message: string }> {
    const slot = await this.findOne(id);
    await this.slotRepo.remove(slot);
    return { message: 'Channeling slot deleted successfully' };
  }

  //Fetches clinician-specific slots to populate their private management dashboards
  async findSlotsByUserId(userId: string): Promise<ChannelingSlot[]> {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor)
      throw new NotFoundException('Doctor profile not found for this user');

    await this.autoCompletePassedSlots();

    return this.slotRepo.find({
      where: { doctorId: doctor.id },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  //Lists all active upcoming consultation windows for public patient discovery
  async getAvailableSlotsWithDoctors(): Promise<ChannelingSlot[]> {
    await this.autoCompletePassedSlots();

    // Return only ACTIVE slots where the booking window is still open:
    // – future dates: always included
    // – today: only if (start_time - booking_cutoff_minutes) is still in the future
    return this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .where('slot.status = :status', { status: SlotStatus.ACTIVE })
      .andWhere(
        // Slot times are stored as Asia/Colombo (IST+5:30) local strings.
        // We interpret them in that timezone so the cutoff comparison is IST vs IST.
        `(
          slot.date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
          OR (
            slot.date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Colombo')::date
            AND (
              TO_TIMESTAMP(slot.date || ' ' || slot.start_time, 'YYYY-MM-DD HH24:MI')
                AT TIME ZONE 'Asia/Colombo'
              - (slot.booking_cutoff_minutes * INTERVAL '1 minute')
            ) > CURRENT_TIMESTAMP
          )
        )`,
      )
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.start_time', 'ASC')
      .getMany();
  }
}