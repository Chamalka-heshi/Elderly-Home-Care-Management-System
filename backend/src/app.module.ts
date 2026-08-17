import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { appConfig } from './config/app.config';
import { JwtConfigModule } from './common/modules/jwt-config.module';
import { GlobalSecurityGuard } from './common/guards/global-security.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthThrottlerGuard } from './common/guards/auth-throttler.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

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
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BackupModule } from './modules/backup/backup.module';

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
    // Global defaults are permissive enough for authenticated dashboard usage.
    // Auth endpoints override these with stricter limits via @Throttle() decorator.
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,   // 1 minute window
        limit: 200,   // 200 requests per minute (covers rapid dashboard navigation)
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour window
        limit: 2000,  // 2000 requests per hour
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

    host: configService.get<string>('DB_HOST'),
    port: Number(configService.get<string>('DB_PORT')),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),

    entities: [__dirname + '/**/*.entity{.ts,.js}'],

    synchronize: configService.get<string>('NODE_ENV') === 'development',
    logging: configService.get<string>('NODE_ENV') === 'development',

    // Force all Date columns to be returned/stored as UTC ISO strings with Z suffix
    // Without this, dates lack the Z marker and browsers misparse them as local time
    timezone: 'Z',

    ssl: {
      rejectUnauthorized: false,
    },
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
    CloudinaryModule,
    BackupModule,
  ],

  // Global Security Guards
  // Enforces mandatory authentication and role-based access control across all application endpoints by default.
  providers: [
    JwtAuthGuard,
    CsrfGuard,
    RolesGuard,
    AuthThrottlerGuard,
    { provide: APP_GUARD, useClass: GlobalSecurityGuard },
  ],
})
export class AppModule {}
