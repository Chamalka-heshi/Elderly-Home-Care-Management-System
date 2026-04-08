import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { FamilyModule } from '../family/family.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { CaregiversModule } from '../caregivers/caregivers.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    FamilyModule,
    DoctorsModule,
    CaregiversModule,
    PatientsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRATION');

        if (!secret) {
          throw new Error(
            'JWT_SECRET is not defined.',
          );
        }
        if (!expiresIn) {
          throw new Error(
            'JWT_EXPIRATION is not defined.',
          );
        }

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FirebaseAdminService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}