import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';

import { Admin }                 from './entities/admin.entity';
import { CreateAdminDto }        from './dto/create-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { UsersService }          from '../users/users.service';
import { UserRole }              from '../../common/enums/user-role.enum';
import { Patient }               from '../patients/entities/patient.entity';
import { FamilyMember }          from '../family/entities/family-member.entity';
import { Doctor }                from '../doctors/entities/doctor.entity';
import { Caregiver }             from '../caregivers/entities/caregiver.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    @InjectRepository(Caregiver)
    private readonly caregiverRepository: Repository<Caregiver>,

    @InjectRepository(FamilyMember)
    private readonly familyRepository: Repository<FamilyMember>,

    private readonly usersService: UsersService,
  ) {}

  // Admin Management

  // Creates the user record first so the admin entity can reference it via foreign key.
  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { email, password, fullName, contactNumber, nic } = createAdminDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Prevent duplicate NIC registrations across admin accounts.
    const existingNic = await this.adminRepository.findOne({ where: { nic } });
    if (existingNic) {
      throw new BadRequestException('NIC already registered');
    }

    const user = await this.usersService.create(
      email,
      password,
      UserRole.ADMIN,
      fullName,
      contactNumber,
    );

    const admin = this.adminRepository.create({ user, nic });
    return this.adminRepository.save(admin);
  }

  // Returns all admin accounts ordered newest-first for the management panel.
  async findAll(): Promise<Admin[]> {
    return this.adminRepository.find({
      relations: ['user'],
      order: { user: { createdAt: 'DESC' } },
    });
  }

  // Resolves the admin record from a user id while excluding sensitive fields like password hash.
  async findByUserId(id: string): Promise<Admin> {
    // Resolve the admin record id first to avoid loading a password hash.
    const adminRef = await this.adminRepository.findOne({
      where: { user: { id } },
      select: { id: true },
    });

    if (!adminRef) {
      throw new NotFoundException('Admin not found');
    }

    const admin = await this.adminRepository.findOne({
      where: { id: adminRef.id },
      relations: ['user'],
      select: {
        id:  true,
        nic: true,
        user: {
          id:            true,
          fullName:      true,
          email:         true,
          role:          true,
          contactNumber: true,
          isActive:      true,
          createdAt:     true,
        },
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  // Deletes the user record because cascading removes the linked admin row automatically.
  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    await this.usersService.deleteUser(admin.user.id);
  }

  // Dashboard Statistics

  // Runs all count queries in parallel to minimise response time for the dashboard load.
  async getDashboardStats() {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const [
      totalFamilies,
      totalPatients,
      totalAdmins,
      activePatients,
      totalDoctors,
      totalCaregivers,
      newPatientsThisMonth,
    ] = await Promise.all([
      this.familyRepository.count({ where: { user: { isActive: true } } }),
      this.patientRepository.count(),
      this.adminRepository.count({ where: { user: { isActive: true } } }),
      this.patientRepository.count({ where: { isActive: true } }),
      this.doctorRepository.count({ where: { user: { isActive: true } } }),
      this.caregiverRepository.count({ where: { user: { isActive: true } } }),
      this.patientRepository.count({
        where: { createdAt: MoreThanOrEqual(firstDayOfMonth) },
      }),
    ]);

    const earnings             = 125000;
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

  // Family Management

  // Loads patients relation so the count can be included without a separate query.
  async getAllFamilies() {
    const families = await this.familyRepository.find({
      relations: ['user', 'patients'],
      order: { user: { createdAt: 'DESC' } },
    });

    return {
      families: families.map((family) => ({
        id:            family.id,
        fullName:      family.user.fullName,
        email:         family.user.email,
        contactNumber: family.user.contactNumber,
        isActive:      family.user.isActive,
        patientsCount: family.patients?.length || 0,
        joinedDate:    family.user.createdAt,
      })),
      total: families.length,
    };
  }

  // Returns a single family with their patient count for the admin detail view.
  async getFamilyById(id: string) {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['user', 'patients'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return {
      id:            family.id,
      fullName:      family.user.fullName,
      email:         family.user.email,
      contactNumber: family.user.contactNumber,
      isActive:      family.user.isActive,
      patientsCount: family.patients?.length || 0,
      joinedDate:    family.user.createdAt,
    };
  }

  // Centralises activation state on the User record so it propagates to all role-based guards.
  async toggleFamilyStatus(id: string, isActive: boolean) {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (isActive) {
      await this.usersService.activateUser(family.user.id);
    } else {
      await this.usersService.deactivateUser(family.user.id);
    }

    return {
      id:       family.id,
      fullName: family.user.fullName,
      isActive,
    };
  }

  // Patient Management

  // Returns all patients with their owning family name for admin-level oversight.
  async getAllPatients() {
    const patients = await this.patientRepository.find({
      relations: ['familyMember', 'familyMember.user'],
      order: { createdAt: 'DESC' },
    });

    return {
      patients: patients.map((patient) => this.mapPatient(patient)),
      total: patients.length,
    };
  }

  // Returns a single patient's full medical profile for admin review.
  async getPatientById(id: string) {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['familyMember', 'familyMember.user'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.mapPatient(patient);
  }

  // Removes the patient record permanently when a data-removal request is received.
  async deletePatient(id: string): Promise<void> {
    const patient = await this.patientRepository.findOne({ where: { id } });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    await this.patientRepository.remove(patient);
  }

  // Admin Profile

  // Delegates user-field updates to UsersService to avoid loading the full relation unnecessarily.
  async updateProfileByUserId(userId: string, updateData: UpdateAdminProfileDto) {
    const admin = await this.adminRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    if (updateData.fullName || updateData.contactNumber) {
      await this.usersService.update(userId, {
        ...(updateData.fullName      && { fullName: updateData.fullName }),
        ...(updateData.contactNumber && { contactNumber: updateData.contactNumber }),
      });
    }

    const updatedUser = await this.usersService.findById(userId);

    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    const updatedAdmin = await this.adminRepository.findOne({
      where: { user: { id: userId } },
    });

    return {
      id:            updatedUser.id,
      fullName:      updatedUser.fullName,
      email:         updatedUser.email,
      role:          updatedUser.role,
      contactNumber: updatedUser.contactNumber,
      nic:           updatedAdmin?.nic ?? null,
    };
  }

  // Private Helpers

  // Centralised mapper so getAllPatients and getPatientById always produce identical response shapes.
  private mapPatient(patient: Patient) {
    return {
      id:                 patient.id,
      fullName:           patient.fullName,
      nic:                patient.nic,
      dateOfBirth:        patient.dateOfBirth,
      createdAt:          patient.createdAt,
      medicalHistory:     patient.medicalHistory,
      chronicConditions:  patient.chronicConditions,
      allergies:          patient.allergies,
      currentMedications: patient.currentMedications,
      bloodGroup:         patient.bloodGroup,
      gender:             patient.gender,
      address:            patient.address,
      contactNumber:      patient.contactNumber,
      emergencyContact:   patient.emergencyContact,
      isActive:           patient.isActive,
      familyMemberId:     patient.familyMemberId,
      familyName:         patient.familyMember?.user?.fullName || 'N/A',
    };
  }
}
