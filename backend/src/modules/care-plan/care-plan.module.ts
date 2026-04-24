import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarePlan } from './entities/care-plan.entity';
import { CarePlanService } from './care-plan.service';
import { CarePlanController } from './care-plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CarePlan])],
  providers: [CarePlanService],
  controllers: [CarePlanController],
  exports: [CarePlanService],
})
export class CarePlanModule {}
