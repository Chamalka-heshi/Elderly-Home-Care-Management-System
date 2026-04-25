import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { ChannelingSlot, SlotStatus } from './entities/channeling-slot.entity';
import {
  CreateChannelingSlotDto,
  UpdateChannelingSlotDto,
  UpdateDoctorSlotFeeDto,
  QueryChannelingSlotsDto,
} from './dto/channeling-slot.dto';
import { Doctor } from '../doctors/entities/doctor.entity';

function weekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7; 
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

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

  async create(dto: CreateChannelingSlotDto): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
      relations: ['user'] 
    });
    
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (doctor.user && doctor.user.isActive === false) throw new BadRequestException('Doctor is not active');

    const today = new Date().toISOString().split('T')[0];
    if (dto.date < today) throw new BadRequestException('Slot date must be today or in the future');

    if (toMinutes(dto.startTime) >= toMinutes(dto.endTime))
      throw new BadRequestException('startTime must be before endTime');

    const mon = weekStart(dto.date);
    const sun = new Date(mon);
    sun.setUTCDate(sun.getUTCDate() + 6);

    const monStr = mon.toISOString().split('T')[0];
    const sunStr = sun.toISOString().split('T')[0];

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

    if (uniqueDays.size > 3)
      throw new ConflictException('Doctor already has slots on 3 days this week (maximum allowed)');

    const existing = await this.slotRepo.find({
      where: { doctorId: dto.doctorId, date: dto.date, status: In([SlotStatus.ACTIVE, SlotStatus.PENDING]) },
    });

    const newStart = toMinutes(dto.startTime);
    const newEnd = toMinutes(dto.endTime);

    for (const slot of existing) {
      const exStart = toMinutes(slot.startTime);
      const exEnd = toMinutes(slot.endTime);
      if (newStart < exEnd && newEnd > exStart) {
        throw new ConflictException(`Time overlaps with existing slot ${slot.startTime}–${slot.endTime}`);
      }
    }

    const slot = this.slotRepo.create({
      ...dto,
      status: SlotStatus.PENDING,
      // Seed the doctor's current consultation fee; doctor can update it later
      consultationFee: doctor.consultationFee ?? null,
    });

    return this.slotRepo.save(slot);
  }

  async acceptSlot(id: string, userId: string): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({ where: { user: { id: userId } } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const slot = await this.slotRepo.findOne({ where: { id, doctorId: doctor.id } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status !== SlotStatus.PENDING) throw new BadRequestException('Only pending slots can be accepted');

    slot.status = SlotStatus.ACTIVE;
    return this.slotRepo.save(slot);
  }

  async rejectSlot(id: string, userId: string): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({ where: { user: { id: userId } } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const slot = await this.slotRepo.findOne({ where: { id, doctorId: doctor.id } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.status !== SlotStatus.PENDING) throw new BadRequestException('Only pending slots can be rejected');

    slot.status = SlotStatus.REJECTED;
    return this.slotRepo.save(slot);
  }

  async findAll(query: QueryChannelingSlotsDto): Promise<{ slots: ChannelingSlot[]; total: number }> {
    const qb = this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.startTime', 'ASC');

    if (query.doctorId) qb.andWhere('slot.doctorId = :doctorId', { doctorId: query.doctorId });
    if (query.fromDate) qb.andWhere('slot.date >= :fromDate', { fromDate: query.fromDate });
    if (query.toDate) qb.andWhere('slot.date <= :toDate', { toDate: query.toDate });
    if (query.status) qb.andWhere('slot.status = :status', { status: query.status });

    const [slots, total] = await qb.getManyAndCount();
    return { slots, total };
  }

  async findOne(id: string): Promise<ChannelingSlot> {
    const slot = await this.slotRepo.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!slot) throw new NotFoundException('Channeling slot not found');
    return slot;
  }

  async getWeeklySchedule(doctorId: string): Promise<Record<string, string[]>> {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const today = new Date().toISOString().split('T')[0];

    const slots = await this.slotRepo.find({
      where: { doctorId, status: SlotStatus.ACTIVE, date: MoreThanOrEqual(today) as any },
      select: ['date'],
      order: { date: 'ASC' },
    });

    const schedule: Record<string, Set<string>> = {};
    for (const s of slots) {
      const wk = weekKey(s.date);
      if (!schedule[wk]) schedule[wk] = new Set();
      schedule[wk].add(s.date);
    }

    return Object.fromEntries(Object.entries(schedule).map(([wk, days]) => [wk, [...days]]));
  }

  async findSlotsByUserId(userId: string): Promise<ChannelingSlot[]> {
    const doctor = await this.doctorRepo.findOne({ where: { user: { id: userId } } });
    if (!doctor) throw new NotFoundException('Doctor profile not found for this user');

    return this.slotRepo.find({
      where: { doctorId: doctor.id },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async getAvailableSlotsWithDoctors(): Promise<ChannelingSlot[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.slotRepo.find({
      where: { status: SlotStatus.ACTIVE, date: MoreThanOrEqual(today) as any },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateChannelingSlotDto): Promise<ChannelingSlot> {
    const slot = await this.findOne(id);
    const newDate = dto.date ?? slot.date;
    const newStart = dto.startTime ?? slot.startTime;
    const newEnd = dto.endTime ?? slot.endTime;

    if (toMinutes(newStart) >= toMinutes(newEnd)) throw new BadRequestException('startTime must be before endTime');
    const today = new Date().toISOString().split('T')[0];
    if (newDate < today) throw new BadRequestException('Slot date must be today or in the future');

    Object.assign(slot, dto);
    return this.slotRepo.save(slot);
  }

  /**
   * Doctor updates the consultation fee for one of their own slots.
   * Admin cannot call this — it is guarded at the controller level.
   */
  async updateDoctorSlotFee(
    slotId: string,
    userId: string,
    dto: UpdateDoctorSlotFeeDto,
  ): Promise<ChannelingSlot> {
    const doctor = await this.doctorRepo.findOne({ where: { user: { id: userId } } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    const slot = await this.slotRepo.findOne({ where: { id: slotId, doctorId: doctor.id } });
    if (!slot) throw new NotFoundException('Slot not found or does not belong to this doctor');

    slot.consultationFee = dto.consultationFee;
    return this.slotRepo.save(slot);
  }

  async cancel(id: string): Promise<{ message: string }> {
    const slot = await this.findOne(id);
    if (slot.status === SlotStatus.CANCELLED) throw new BadRequestException('Slot is already cancelled');
    slot.status = SlotStatus.CANCELLED;
    await this.slotRepo.save(slot);
    return { message: 'Channeling slot cancelled successfully' };
  }

  async remove(id: string): Promise<{ message: string }> {
    const slot = await this.findOne(id);
    await this.slotRepo.remove(slot);
    return { message: 'Channeling slot deleted successfully' };
  }
}