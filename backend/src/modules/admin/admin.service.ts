/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { Patient } from '../patients/entities/patient.entity';
import { FamilyMember } from '../family/entities/family-member.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(FamilyMember)
    private familyRepository: Repository<FamilyMember>,
    private usersService: UsersService,
  ) {}

  // ==================== ADMIN MANAGEMENT ====================

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { email, password, ...adminData } = createAdminDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.usersService.create(email, password, UserRole.ADMIN);

    const admin = this.adminRepository.create({ user, ...adminData });
    return this.adminRepository.save(admin);
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async findByUserId(userId: string): Promise<Admin | null> {
    return this.adminRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: string, updateData: Partial<CreateAdminDto>): Promise<Admin> {
    const admin = await this.findOne(id);
    Object.assign(admin, updateData);
    return this.adminRepository.save(admin);
  }

  /**
   * Deactivate is handled entirely via User.isActive — single source of truth.
   */
  async deactivate(id: string): Promise<void> {
    const admin = await this.findOne(id);
    await this.usersService.deactivateUser(admin.user.id);
  }

  async activate(id: string): Promise<void> {
    const admin = await this.findOne(id);
    await this.usersService.activateUser(admin.user.id);
  }

  // ==================== DASHBOARD STATISTICS ====================

  async getDashboardStats() {
    const [totalFamilies, totalPatients, totalAdmins, activePatients] =
      await Promise.all([
        this.familyRepository.count({ where: { user: { isActive: true } } }),
        this.patientRepository.count(),
        this.adminRepository.count({ where: { user: { isActive: true } } }),
        this.patientRepository.count({ where: { isActive: true } }),
      ]);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newPatientsThisMonth = await this.patientRepository.count({
      where: { createdAt: MoreThanOrEqual(firstDayOfMonth) },
    });

    const earnings = 125000;
    const upcomingAppointments = 0;
    const totalDoctors = 0;
    const totalCaregivers = 0;

    return {
      totalFamilies,
      totalPatients,
      totalDoctors,
      totalCaregivers,
      totalAdmins,
      activePatients,
      newPatientsThisMonth,
      upcomingAppointments,
      earnings,
    };
  }

  // ==================== FAMILY MANAGEMENT ====================

  async getAllFamilies() {
    const families = await this.familyRepository.find({
      relations: ['user', 'patients'],
      order: { createdAt: 'DESC' },
    });

    return {
      families: families.map((family) => ({
        id: family.id,
        fullName: family.fullName,
        email: family.user.email,
        contactNumber: family.contactNumber,
        isActive: family.user.isActive,
        patientsCount: family.patients?.length || 0,
        joinedDate: family.createdAt,
      })),
      total: families.length,
    };
  }

  async getFamilyById(id: string) {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['user', 'patients'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return {
      id: family.id,
      fullName: family.fullName,
      email: family.user.email,
      contactNumber: family.contactNumber,
      isActive: family.user.isActive,
      patientsCount: family.patients?.length || 0,
      joinedDate: family.createdAt,
    };
  }

  async toggleFamilyStatus(id: string, isActive: boolean) {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Single source of truth: only update User.isActive
    if (isActive) {
      await this.usersService.activateUser(family.user.id);
    } else {
      await this.usersService.deactivateUser(family.user.id);
    }

    return {
      id: family.id,
      fullName: family.fullName,
      isActive,
    };
  }

  // ==================== PATIENT MANAGEMENT ====================

  async getAllPatients() {
    const patients = await this.patientRepository.find({
      relations: ['familyMember', 'familyMember.user'],
      order: { createdAt: 'DESC' },
    });

    return {
      patients: patients.map((patient) => ({
        id: patient.id,
        name: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        admissionDate: patient.createdAt,
        medicalCondition: patient.chronicConditions || patient.medicalHistory,
        status: patient.isActive ? 'Active' : 'Inactive',
        familyId: patient.familyMemberId,
        familyName: patient.familyMember?.fullName || 'N/A',
      })),
      total: patients.length,
    };
  }

  async getPatientById(id: string) {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['familyMember', 'familyMember.user'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return {
      id: patient.id,
      name: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      admissionDate: patient.createdAt,
      medicalCondition: patient.chronicConditions || patient.medicalHistory,
      status: patient.isActive ? 'Active' : 'Inactive',
      familyId: patient.familyMemberId,
      familyName: patient.familyMember?.fullName || 'N/A',
    };
  }

  async deletePatient(id: string) {
    const patient = await this.patientRepository.findOne({ where: { id } });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    await this.patientRepository.remove(patient);
  }
}
