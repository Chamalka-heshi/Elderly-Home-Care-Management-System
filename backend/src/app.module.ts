import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),

    // ── JWT (global) ─────────────────────────────────────────────────────
    // JwtModule + UsersModule available globally via JwtConfigModule.
    // JwtAuthGuard and RolesGuard are registered below as APP_GUARD —
    // they are instantiated at app level so DI resolves correctly for
    // every feature module without each needing to import UsersModule.
    JwtConfigModule,

    // ── Database ─────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host:     configService.get<string>('app.db.host'),
        port:     configService.get<number>('app.db.port'),
        username: configService.get<string>('app.db.username'),
        password: configService.get<string>('app.db.password'),
        database: configService.get<string>('app.db.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('app.nodeEnv') === 'development',
        logging:     configService.get<string>('app.nodeEnv') === 'development',
      }),
    }),

    // ── Feature modules ──────────────────────────────────────────────────
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
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
