import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarePlan, CarePlanDurationUnit } from './entities/care-plan.entity';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';

@Injectable()
export class CarePlanService {
  constructor(
    @InjectRepository(CarePlan)
    private readonly carePlanRepo: Repository<CarePlan>,
  ) {}

  async getActivePlans(): Promise<CarePlan[]> {
    return this.carePlanRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllPlans(): Promise<CarePlan[]> {
    return this.carePlanRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createPlan(dto: CreateCarePlanDto): Promise<CarePlan> {
    const plan = this.carePlanRepo.create({
      ...dto,
      durationUnit: dto.durationUnit ?? CarePlanDurationUnit.DAYS,
    });

    return this.carePlanRepo.save(plan);
  }

  async updatePlan(id: string, dto: UpdateCarePlanDto): Promise<CarePlan> {
    const plan = await this.carePlanRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Care plan not found');

    Object.assign(plan, dto);
    return this.carePlanRepo.save(plan);
  }

  async deactivatePlan(id: string): Promise<{ message: string }> {
    const plan = await this.carePlanRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Care plan not found');

    if (!plan.isActive) {
      return { message: 'Care plan is already inactive' };
    }

    plan.isActive = false;
    await this.carePlanRepo.save(plan);

    return { message: 'Care plan deactivated successfully' };
  }
}
