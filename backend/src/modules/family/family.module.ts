/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule }      from '@nestjs/typeorm';
import { FamilyService }      from './family.service';
import { FamilyController }   from './family.controller';
import { FamilyMember }       from './entities/family-member.entity';
import { UsersModule }        from '../users/users.module';
import { PatientsModule }     from '../patients/patients.module';
import { AppointmentModule }  from '../appointments/appointment.module';
import { PrescriptionsModule } from '../prescription/prescription.module';
import { PaymentsModule }     from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FamilyMember]),
    UsersModule,
    forwardRef(() => PatientsModule),
    AppointmentModule,
    PrescriptionsModule,
    PaymentsModule,
  ],
  controllers: [FamilyController],
  providers:   [FamilyService],
  exports:     [FamilyService],
})
export class FamilyModule {}
