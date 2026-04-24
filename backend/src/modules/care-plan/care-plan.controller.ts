import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CarePlanService } from './care-plan.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';

@Controller('care-plans')
export class CarePlanController {
  constructor(private readonly carePlanService: CarePlanService) {}

  @Public()
  @Get()
  getActivePlans() {
    return this.carePlanService.getActivePlans();
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllPlans() {
    return this.carePlanService.getAllPlans();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createPlan(@Body() dto: CreateCarePlanDto) {
    return this.carePlanService.createPlan(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarePlanDto,
  ) {
    return this.carePlanService.updatePlan(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  deletePlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.carePlanService.deactivatePlan(id);
  }
}
