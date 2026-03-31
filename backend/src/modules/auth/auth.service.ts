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
import * as crypto from 'crypto';
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

    const token = this.generateToken(user.id, user.email, user.role);

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
  async createDoctor(createDoctorDto: CreateDoctorDto, adminUserId: string) {
    const admin = await this.usersService.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create doctor accounts');
    }

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
    adminUserId: string,
  ) {
    const admin = await this.usersService.findById(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create caregiver accounts');
    }

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
    currentAdminUserId: string,
  ) {
    const admin = await this.usersService.findById(currentAdminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create admin accounts');
    }

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
    const familyUser = await this.usersService.findById(familyUserId);
    if (!familyUser || familyUser.role !== UserRole.FAMILY) {
      throw new ForbiddenException(
        'Only family members can create patient accounts',
      );
    }

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
        break;
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        profile: profileData,
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
        break;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      profile: profileData,
    };
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
  // Handles Google sign-in via Firebase.
  // Firebase verifies OAuth on the frontend; we verify the ID token here
  // and issue our own JWT.

  async firebaseAuth(
    idToken: string,
  ): Promise<{ token: string; user: any; isNewUser: boolean }> {

    // 1. Verify the Firebase ID token with the Admin SDK.
    let decodedToken: Awaited<ReturnType<FirebaseAdminService['verifyIdToken']>>;
    try {
      decodedToken = await this.firebaseAdmin.verifyIdToken(idToken);
    } catch (err: any) {
      throw new UnauthorizedException(
        `Invalid Firebase token: ${err?.message ?? 'verification failed'}`,
      );
    }

    // 2. Extract user info from the verified token.
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      throw new BadRequestException(
        'Your Google account does not have a public email address. ' +
        'Please use a different sign-in method.',
      );
    }

    // 3. Find existing user or create a new one.
    let user = await this.userRepository.findOne({ where: { email } });
    let isNewUser = false;

    if (!user) {
      // First sign-in — create a FAMILY account automatically.
      // Social-login users never use a password, so store an un-guessable placeholder.
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
      isNewUser = true;

    } else if (!user.firebaseUid) {
      // Existing email/password account — link Firebase UID to it.
      user.firebaseUid = uid;
      if (!user.avatarUrl && picture) user.avatarUrl = picture;
      await this.userRepository.save(user);
    }

    // 4. Issue our own JWT (same structure as regular login).
    const token = this.generateToken(user.id, user.email, user.role);

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

  /**
   * Generate JWT Token
   */
  private generateToken(userId: string, email: string, role: UserRole): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  /**
   * Validate User (used by JWT Strategy)
   */
  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}