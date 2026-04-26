import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { FamilyModule } from '../family/family.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { CaregiversModule } from '../caregivers/caregivers.module';
import { PatientsModule } from '../patients/patients.module';
import { AdminModule } from '../admin/admin.module';
import { MailModule } from '../mail/mail.module';

// JwtModule is globally registered via JwtConfigModule (imported in AppModule).
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    UsersModule,
    FamilyModule,
    DoctorsModule,
    CaregiversModule,
    PatientsModule,
    AdminModule,
    MailModule,   // ← added for forgot-password email delivery
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAdminService],
  exports: [AuthService],
})
export class AuthModule {}