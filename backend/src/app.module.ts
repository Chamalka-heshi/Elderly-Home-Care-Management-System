import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { appConfig } from './config/app.config';
import { JwtConfigModule } from './common/modules/jwt-config.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FamilyModule } from './modules/family/family.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { CaregiversModule } from './modules/caregivers/caregivers.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContactModule } from './modules/contact/contact.module';
import { PrescriptionsModule } from './modules/prescription/prescription.module';
import { ChannelingSlotModule } from './modules/channeling-slot/channeling-slot.module';
import { AppointmentModule } from './modules/appointments/appointment.module';
import { CarePlanModule } from './modules/care-plan/care-plan.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';

// Orchestrates the entire clinical system by aggregating core configurations, security guards, and feature-specific modules into a unified root.
@Module({
  imports: [
    // Configuration Infrastructure
    // Loads environment-specific variables and system settings to ensure consistent behavior across different deployment stages.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),

    // Rate Limiting
    // Protects auth endpoints and APIs from brute-force attacks by limiting requests per IP address
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 100, // 100 requests per hour
      },
    ]),

    JwtConfigModule,

    // Database Connectivity
    // Establishes a persistent connection to the PostgreSQL cluster, enabling secure data storage for clinical and administrative records.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('app.db.host'),
        port: configService.get<number>('app.db.port'),
        username: configService.get<string>('app.db.username'),
        password: configService.get<string>('app.db.password'),
        database: configService.get<string>('app.db.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('app.nodeEnv') === 'development',
        logging: configService.get<string>('app.nodeEnv') === 'development',
      }),
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    FamilyModule,
    PatientsModule,
    DoctorsModule,
    CaregiversModule,
    AdminModule,
    ContactModule,
    PrescriptionsModule,
    ChannelingSlotModule,
    AppointmentModule,
    CarePlanModule,
    BookingsModule,
    PaymentsModule,
  ],

  // Global Security Guards
  // Enforces mandatory authentication and role-based access control across all application endpoints by default.
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
