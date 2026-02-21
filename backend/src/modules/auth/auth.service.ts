import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { FamilyService } from '../family/family.service';
import { DoctorsService } from '../doctors/doctors.service';
import { CaregiversService } from '../caregivers/caregivers.service';
import { PatientsService } from '../patients/patients.service';
import { FamilySignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateDoctorDto } from '../doctors/dto/create-doctor.dto';
import { CreateCaregiverDto } from '../caregivers/dto/create-caregiver.dto';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private familyService: FamilyService,
    private doctorsService: DoctorsService,
    private caregiversService: CaregiversService,
    private patientsService: PatientsService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * PUBLIC: Family Member Signup
   * Only role that can self-register
   */
  async familySignup(signupDto: FamilySignupDto) {
    const { email, password, fullName, contactNumber } = signupDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Create user account
    const user = await this.usersService.create(
      email,
      password,
      UserRole.FAMILY,
    );

    // Create family member profile
    const familyMember = await this.familyService.create({
      user,
      fullName,
      contactNumber,
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Family member registered successfully',
      user: {
        id: user.id,
        fullName: familyMember.fullName,
        email: user.email,
        role: user.role,
        contactNumber: familyMember.contactNumber,
      },
      token,
    };
  }

  /**
   * ADMIN ONLY: Create Doctor Account
   */
  async createDoctor(createDoctorDto: CreateDoctorDto, adminUserId: string) {
    // Verify admin role
    const admin = await this.usersService.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create doctor accounts');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(
      createDoctorDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Create doctor using the service
    const doctor = await this.doctorsService.create(createDoctorDto);

    return {
      message: 'Doctor account created successfully',
      doctor: {
        id: doctor.id,
        fullName: doctor.fullName,
        email: doctor.user.email,
        role: doctor.user.role,
        contactNumber: doctor.contactNumber,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
      },
    };
  }

  /**
   * ADMIN ONLY: Create Caregiver Account
   */
  async createCaregiver(
    createCaregiverDto: CreateCaregiverDto,
    adminUserId: string,
  ) {
    // Verify admin role
    const admin = await this.usersService.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create caregiver accounts');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(
      createCaregiverDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Create caregiver using the service
    const caregiver = await this.caregiversService.create(createCaregiverDto);

    return {
      message: 'Caregiver account created successfully',
      caregiver: {
        id: caregiver.id,
        fullName: caregiver.fullName,
        email: caregiver.user.email,
        role: caregiver.user.role,
        contactNumber: caregiver.contactNumber,
      },
    };
  }

  /**
   * ADMIN ONLY: Create Admin Account
   */
  async createAdmin(
    createAdminDto: CreateAdminDto,
    currentAdminUserId: string,
  ) {
    // Verify admin role
    const admin = await this.usersService.findById(currentAdminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create admin accounts');
    }

    const { email, password, fullName, contactNumber } = createAdminDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Create admin user account
    const user = await this.usersService.create(
      email,
      password,
      UserRole.ADMIN,
    );

    return {
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        fullName,
        email: user.email,
        role: user.role,
        contactNumber,
      },
    };
  }

  /**
   * FAMILY ONLY: Create Patient Profile
   */
  async createPatient(
    createPatientDto: CreatePatientDto,
    familyUserId: string,
  ) {
    // Verify family role
    const familyUser = await this.usersService.findById(familyUserId);
    if (!familyUser || familyUser.role !== UserRole.FAMILY) {
      throw new ForbiddenException(
        'Only family members can create patient accounts',
      );
    }

    // Get family member profile
    const familyMember = await this.familyService.findByUserId(familyUserId);
    if (!familyMember) {
      throw new NotFoundException('Family member profile not found');
    }

    // Create patient profile
    const patient = await this.patientsService.create(
      familyMember.id,
      createPatientDto,
    );

    return {
      message: 'Patient profile created successfully',
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        familyMemberId: familyMember.id,
      },
    };
  }

  /**
   * UNIVERSAL: Login (All Roles)
   * Automatically detects role from user record
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get role-specific profile data based on user's role
    let profileData = null;
    let fullName = null;
    let contactNumber = null;

    switch (user.role) {
      case UserRole.FAMILY:
        profileData = await this.familyService.findByUserId(user.id);
        if (profileData) {
          fullName = profileData.fullName;
          contactNumber = profileData.contactNumber;
        }
        break;

      case UserRole.DOCTOR:
        profileData = await this.doctorsService.findByUserId(user.id);
        if (profileData) {
          fullName = profileData.fullName;
          contactNumber = profileData.contactNumber;
        }
        break;

      case UserRole.CAREGIVER:
        profileData = await this.caregiversService.findByUserId(user.id);
        if (profileData) {
          fullName = profileData.fullName;
          contactNumber = profileData.contactNumber;
        }
        break;

      case UserRole.ADMIN:
        fullName = 'Admin';
        break;
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        fullName,
        email: user.email,
        role: user.role,
        contactNumber,
        profile: profileData,
      },
      token,
    };
  }

  /**
   * Get Current User Profile
   */
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get role-specific profile data
    let profileData = null;
    let fullName = null;
    let contactNumber = null;

    switch (user.role) {
      case UserRole.FAMILY:
        profileData = await this.familyService.findByUserId(user.id);
        if (profileData) {
          fullName = profileData.fullName;
          contactNumber = profileData.contactNumber;
        }
        break;

      case UserRole.DOCTOR:
        profileData = await this.doctorsService.findByUserId(user.id);
        if (profileData) {
          fullName = profileData.fullName;
          contactNumber = profileData.contactNumber;
        }
        break;

      case UserRole.CAREGIVER:
        profileData = await this.caregiversService.findByUserId(user.id);
        if (profileData) {
          fullName = profileData.fullName;
          contactNumber = profileData.contactNumber;
        }
        break;

      case UserRole.ADMIN:
        fullName = 'Admin';
        break;
    }

    return {
      id: user.id,
      fullName,
      email: user.email,
      role: user.role,
      contactNumber,
      profile: profileData,
    };
  }

  /**
   * Delete Account (Soft delete / Deactivate)
   */
  async deleteAccount(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'Account deleted successfully' };
  }

  /**
   * Generate JWT Token
   */
  private generateToken(userId: string, email: string, role: UserRole): string {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Validate User (used by JWT Strategy)
   */
  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
