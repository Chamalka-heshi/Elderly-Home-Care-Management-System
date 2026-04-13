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
import { Doctor } from '../doctors/entities/doctor.entity';
import { Caregiver } from '../caregivers/entities/caregiver.entity';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';


@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Caregiver)
    private caregiverRepository: Repository<Caregiver>,
    @InjectRepository(FamilyMember)
    private familyRepository: Repository<FamilyMember>,
    private usersService: UsersService,
  ) {}

  // ==================== ADMIN MANAGEMENT ====================

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { email, password, fullName, contactNumber } = createAdminDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // fullName and contactNumber stored on the User record
    const user = await this.usersService.create(
      email,
      password,
      UserRole.ADMIN,
      fullName,
      contactNumber,
    );

    const admin = this.adminRepository.create({ user });
    return this.adminRepository.save(admin);
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find({
      relations: ['user'],
      order: { user: { createdAt: 'DESC' } },
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
    });
  }

  async update(id: string, updateData: Partial<CreateAdminDto>): Promise<Admin> {
    const admin = await this.findOne(id);

    // Common fields live on the User record
    if (updateData.fullName) admin.user.fullName = updateData.fullName;
    if (updateData.contactNumber) admin.user.contactNumber = updateData.contactNumber;

    return this.adminRepository.save(admin); // cascade saves user
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
    const [totalFamilies, totalPatients, totalAdmins, activePatients,totalDoctors,totalCaregivers] =
      await Promise.all([
        this.familyRepository.count({ where: { user: { isActive: true } } }),
        this.patientRepository.count(),
        this.adminRepository.count({ where: { user: { isActive: true } } }),
        this.patientRepository.count({ where: { isActive: true } }),
        this.doctorRepository.count({ where: { user: { isActive: true } } }),
        this.caregiverRepository.count({ where: { user: { isActive: true } } }),
      ]);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newPatientsThisMonth = await this.patientRepository.count({
      where: { createdAt: MoreThanOrEqual(firstDayOfMonth) },
    });

    const earnings = 125000;
    const upcomingAppointments = 0;

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
      order: { user: { createdAt: 'DESC' } },
    });

    return {
      families: families.map((family) => ({
        id: family.id,
        fullName: family.user.fullName,
        email: family.user.email,
        contactNumber: family.user.contactNumber,
        isActive: family.user.isActive,
        patientsCount: family.patients?.length || 0,
        joinedDate: family.user.createdAt,
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
      fullName: family.user.fullName,
      email: family.user.email,
      contactNumber: family.user.contactNumber,
      isActive: family.user.isActive,
      patientsCount: family.patients?.length || 0,
      joinedDate: family.user.createdAt,
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
      fullName: family.user.fullName,
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
        fullName: patient.fullName,
        nic: patient.nic,
        dateOfBirth: patient.dateOfBirth,
        createdAt: patient.createdAt,
        medicalHistory: patient.medicalHistory,
        chronicConditions: patient.chronicConditions,
        allergies: patient.allergies,
        currentMedications: patient.currentMedications,
        bloodGroup: patient.bloodGroup,
        gender: patient.gender,
        address: patient.address,
        contactNumber: patient.contactNumber,
        emergencyContact: patient.emergencyContact,
        isActive: patient.isActive,
        familyMemberId: patient.familyMemberId,
        familyName: patient.familyMember?.user?.fullName || 'N/A',
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
      fullName: patient.fullName,
      nic: patient.nic,
      dateOfBirth: patient.dateOfBirth,
      createdAt: patient.createdAt,
      medicalHistory: patient.medicalHistory,
      chronicConditions: patient.chronicConditions,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      bloodGroup: patient.bloodGroup,
      gender: patient.gender,
      address: patient.address,
      contactNumber: patient.contactNumber,
      emergencyContact: patient.emergencyContact,
      isActive: patient.isActive,
      familyMemberId: patient.familyMemberId,
      familyName: patient.familyMember?.user?.fullName || 'N/A',
    };
  }

  async deletePatient(id: string) {
    const patient = await this.patientRepository.findOne({ where: { id } });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    await this.patientRepository.remove(patient);
  }

  async findProfileByUserId(userId: string) {
    const admin = await this.findByUserId(userId);
    if (!admin) return null;

    return admin;
  }


  async updateProfileByUserId(userId: string, updateData: UpdateAdminProfileDto) {
    const admin = await this.adminRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    // Update user fields directly via UsersService — no relation loading needed
    if (updateData.fullName || updateData.contactNumber) {
      await this.usersService.update(userId, {
        ...(updateData.fullName && { fullName: updateData.fullName }),
        ...(updateData.contactNumber && { contactNumber: updateData.contactNumber }),
      });
    }

    // Fetch updated user separately for the response
    const updatedUser = await this.usersService.findById(userId);

    return {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      contactNumber: updatedUser.contactNumber,
    };
  }
}