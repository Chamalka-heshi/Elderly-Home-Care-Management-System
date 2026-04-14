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


  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Family Member Signup
  // Only role that can self-register
  // ──────────────────────────────────────────────────────────────────────────
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
        mustChangePassword: false,
      },
      token,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FAMILY ONLY: Create Patient Profile
  // ──────────────────────────────────────────────────────────────────────────
  async createPatient(createPatientDto: CreatePatientDto, familyUserId: string) {
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

  // ──────────────────────────────────────────────────────────────────────────
  // UNIVERSAL: Login (All Roles)
  // ──────────────────────────────────────────────────────────────────────────
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
        // Frontend uses this flag to redirect to the forced password-change page
        mustChangePassword: user.mustChangePassword,
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

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      mustChangePassword: user.mustChangePassword,
      profile: profileData,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Delete Account (soft delete / deactivate)
  // ──────────────────────────────────────────────────────────────────────────
  async deleteAccount(userId: string) {
    await this.usersService.deactivateUser(userId);   
    return { message: 'Account deleted successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Firebase / Google OAuth
  // ──────────────────────────────────────────────────────────────────────────
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
        mustChangePassword: false,
      });

      user = await this.userRepository.save(user);
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
        id:                user.id,
        fullName:          user.fullName,
        email:             user.email,
        role:              user.role,
        contactNumber:     user.contactNumber,
        mustChangePassword: user.mustChangePassword,
      },
      isNewUser,
    };
  }

  async changePassword(userId: string, currentPw: string, newPw: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await this.usersService.validatePassword(currentPw, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.updatePassword(userId, newPw);

    // Clear the forced-change flag now that they have set their own password
    await this.usersService.setMustChangePassword(userId, false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  private generateToken(
    userId: string,
    email: string,
    role: UserRole,
    contactNumber: string,
  ): string {
    return this.jwtService.sign({ sub: userId, email, role, contactNumber });
  }
}
