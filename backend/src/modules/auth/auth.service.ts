import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { FamilyService } from '../family/family.service';
import { DoctorsService } from '../doctors/doctors.service';
import { CaregiversService } from '../caregivers/caregivers.service';
import { AdminService } from '../admin/admin.service';
import { PatientsService } from '../patients/patients.service';
import { FamilySignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateDoctorDto } from '../doctors/dto/create-doctor.dto';
import { CreateCaregiverDto } from '../caregivers/dto/create-caregiver.dto';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

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
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly adminService: AdminService,  
  ) {}

  /**
   * PUBLIC: Family Member Signup
   * Only role that can self-register
   */
  async familySignup(signupDto: FamilySignupDto) {
    const { email, password, fullName, contactNumber } = signupDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.usersService.create(
      email,
      password,
      UserRole.FAMILY,
      fullName,
      contactNumber,
    );

    await this.familyService.create({ user });

    const token = this.generateToken(user.id, user.email, user.role, user.contactNumber);

    return {
      message: 'Family member registered successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
      },
      token,
    };
  }

  /**
   * ADMIN ONLY: Create Doctor Account
   */
  async createDoctor(createDoctorDto: CreateDoctorDto) {
    const existingUser = await this.usersService.findByEmail(createDoctorDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const doctor = await this.doctorsService.create(createDoctorDto);

    return {
      message: 'Doctor account created successfully',
      doctor: {
        id: doctor.id,
        fullName: doctor.user.fullName,
        email: doctor.user.email,
        role: doctor.user.role,
        contactNumber: doctor.user.contactNumber,
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
  ) {
    const existingUser = await this.usersService.findByEmail(createCaregiverDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const caregiver = await this.caregiversService.create(createCaregiverDto);

    return {
      message: 'Caregiver account created successfully',
      caregiver: {
        id: caregiver.id,
        fullName: caregiver.user.fullName,
        email: caregiver.user.email,
        role: caregiver.user.role,
        contactNumber: caregiver.user.contactNumber,
      },
    };
  }

  /**
   * ADMIN ONLY: Create Admin Account
   */
  async createAdmin(
    createAdminDto: CreateAdminDto,
  ) {
    const { email, password, fullName, contactNumber } = createAdminDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.usersService.create(
      email,
      password,
      UserRole.ADMIN,
      fullName,
      contactNumber,
    );

    return {
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
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
    const familyMember = await this.familyService.findByUserId(familyUserId);
    if (!familyMember) {
      throw new NotFoundException('Family member profile not found');
    }

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
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role, user.contactNumber);

    return {
      message: 'Login successful',
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profileData = null;

    switch (user.role) {
      case UserRole.FAMILY:
        profileData = await this.familyService.findByUserId(user.id);
        break;
      case UserRole.DOCTOR:
        profileData = await this.doctorsService.findByUserId(user.id);
        break;
      case UserRole.CAREGIVER:
        profileData = await this.caregiversService.findByUserId(user.id);
        break;
      case UserRole.ADMIN:
        profileData = await this.adminService.findByUserId(user.id);
        break;
    }
    const data = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      profile: profileData,
    };
    return data ;

  }

  /**
   * Delete Account (soft delete / deactivate)
   */
  async deleteAccount(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'Account deleted successfully' };
  }

  // ── POST /api/auth/firebase ───────────────────────────────────────────────
  async firebaseAuth(
    idToken: string,
  ): Promise<{ token: string; user: any; isNewUser: boolean }> {

    let decodedToken: Awaited<ReturnType<FirebaseAdminService['verifyIdToken']>>;
    try {
      decodedToken = await this.firebaseAdmin.verifyIdToken(idToken);
    } catch (err: any) {
      throw new UnauthorizedException(
        `Invalid Firebase token: ${err?.message ?? 'verification failed'}`,
      );
    }

    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      throw new BadRequestException(
        'Your Google account does not have a public email address. ' +
        'Please use a different sign-in method.',
      );
    }

    let user = await this.userRepository.findOne({ where: { email } });
    let isNewUser = false;

    // Existing account — guard against deactivated users the same way login() does
    if (user && !user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    if (!user) {
      user = this.userRepository.create({
        email,
        fullName:      name ?? email.split('@')[0],
        password:      `FIREBASE_OAUTH::${crypto.randomBytes(32).toString('hex')}`,
        role:          UserRole.FAMILY,
        contactNumber: '',
        firebaseUid:   uid,
        avatarUrl:     picture ?? null,
      });

      user = await this.userRepository.save(user);
      
      // Ensures profile is created before returning
      await this.familyService.create({ user });
      
      isNewUser = true;

    } else if (!user.firebaseUid) {
      user.firebaseUid = uid;
      if (!user.avatarUrl && picture) user.avatarUrl = picture;
      await this.userRepository.save(user);
    }

    const token = this.generateToken(user.id, user.email, user.role, user.contactNumber);

    return {
      token,
      user: {
        id:            user.id,
        fullName:      user.fullName,
        email:         user.email,
        role:          user.role,
        contactNumber: user.contactNumber,
      },
      isNewUser,
    };
  }

  private generateToken(
    userId: string,
    email: string,
    role: UserRole,
    contactNumber: string,
  ): string {
    // JwtModule is configured with the secret via JwtConfigModule.
    // No need to pass { secret } here — sign() uses the module-level config.
    return this.jwtService.sign({ sub: userId, email, role, contactNumber });
  }

  async changePassword(userId: string, currentPw: string, newPw: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Single bcrypt validation — no need to call login() separately.
    const isMatch = await this.usersService.validatePassword(currentPw, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.updatePassword(userId, newPw);
  }
}

