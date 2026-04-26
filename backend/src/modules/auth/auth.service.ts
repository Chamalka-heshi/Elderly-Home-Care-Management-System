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
import * as bcrypt from 'bcrypt';
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
import { MailService } from '../mail/mail.service';

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
    private readonly mailService: MailService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Family Member Signup
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
      throw new UnauthorizedException('No account found with this email address.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    const token = this.generateToken(user.id, user.email, user.role, user.contactNumber);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Get Profile
  // ──────────────────────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profileData = null;

    const stripUser = (entity: any) => {
      if (!entity) return null;
      const { user: _, ...rest } = entity;
      return rest;
    };

    switch (user.role) {
      case UserRole.FAMILY:
        profileData = stripUser(await this.familyService.findByUserId(user.id));
        break;
      case UserRole.DOCTOR:
        profileData = stripUser(await this.doctorsService.findByUserId(user.id));
        break;
      case UserRole.CAREGIVER:
        profileData = stripUser(await this.caregiversService.findByUserId(user.id));
        break;
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        profileData = stripUser(await this.adminService.findByUserId(user.id));
        break;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl ?? null,
      profile: profileData,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Logout — stamp lastLogoutAt so all existing tokens are rejected
  // ──────────────────────────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.usersService.setLastLogoutAt(userId, new Date());
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Delete Account
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

    if (user.role === UserRole.FAMILY) {
      const existingFamily = await this.familyService.findByUserId(user.id);
      if (!existingFamily) {
        await this.familyService.create({ user });
      }
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

  // ──────────────────────────────────────────────────────────────────────────
  // Avatar Upload / Remove
  // ──────────────────────────────────────────────────────────────────────────
  async uploadAvatar(
    userId: string,
    file: { mimetype: string; size: number; buffer: Buffer },
  ): Promise<{ avatarUrl: string }> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WEBP, or GIF images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Avatar image must be smaller than 5 MB');
    }

    const base64  = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    await this.usersService.updateAvatar(userId, dataUrl);
    return { avatarUrl: dataUrl };
  }

  async removeAvatar(userId: string): Promise<void> {
    await this.usersService.updateAvatar(userId, null);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Change Password (regular — requires current password)
  // ──────────────────────────────────────────────────────────────────────────
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
    await this.usersService.setMustChangePassword(userId, false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // First-Login Password Change — no current-password check needed.
  // Only allowed when mustChangePassword === true to prevent abuse.
  // ──────────────────────────────────────────────────────────────────────────
  async firstLoginChangePassword(userId: string, newPw: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mustChangePassword) {
      throw new UnauthorizedException(
        'This endpoint is only available on first login.',
      );
    }

    await this.usersService.updatePassword(userId, newPw);
    await this.usersService.setMustChangePassword(userId, false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD — Step 1: Check email & return masked contact number
  // ──────────────────────────────────────────────────────────────────────────
  async checkEmailForReset(email: string): Promise<{ maskedContact: string }> {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());

    if (!user || !user.isActive) {
      // Generic message — don't reveal whether the email exists
      throw new NotFoundException('No account found with this email address.');
    }

    if (!user.contactNumber || user.contactNumber.trim().length < 3) {
      throw new BadRequestException(
        'No contact number is associated with this account. Please contact support.',
      );
    }

    // Mask all but the last 3 digits: "+947123456789" → "**********789"
    const contact = user.contactNumber.trim();
    const last3   = contact.slice(-3);
    const masked  = '*'.repeat(contact.length - 3) + last3;

    return { maskedContact: masked };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD — Step 2: Verify email + contact, send temp password email
  // ──────────────────────────────────────────────────────────────────────────
  async forgotPassword(email: string, contactNumber: string): Promise<{ message: string }> {
    const normEmail   = email.trim().toLowerCase();
    const normContact = contactNumber.trim();

    const user = await this.usersService.findByEmail(normEmail);
    if (!user || !user.isActive) {
      throw new NotFoundException('No account found with this email address.');
    }

    // Verify by comparing last 3 digits — tolerant of formatting differences
    if (!user.contactNumber || user.contactNumber.trim().length < 3) {
      throw new BadRequestException('Contact number not on record. Please contact support.');
    }

    const storedLast3   = user.contactNumber.trim().slice(-3);
    const submittedLast3 = normContact.slice(-3);

    if (storedLast3 !== submittedLast3) {
      throw new UnauthorizedException(
        'The contact number you entered does not match our records.',
      );
    }

    // Generate a random 10-character alphanumeric temp password
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 hex chars, e.g. "a3f7c1b2d4e9"

    // Hash and save as the user's current password; flag them for mandatory change
    const hashed = await bcrypt.hash(tempPassword, 10);
    user.password          = hashed;
    user.mustChangePassword = true;
    await this.userRepository.save(user);

    // Send the temp password by email
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      tempPassword,
    );

    return {
      message:
        'A temporary password has been sent to your email address. ' +
        'Please check your inbox and use it to set a new password.',
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD — Step 3: Verify temp password, set new password, return JWT
  // ──────────────────────────────────────────────────────────────────────────
  async resetPassword(
    email:       string,
    tempPassword: string,
    newPassword:  string,
    confirmPassword: string,
  ): Promise<{ token: string; user: any }> {

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match.');
    }

    const normEmail = email.trim().toLowerCase();
    const user      = await this.usersService.findByEmail(normEmail);

    if (!user || !user.isActive) {
      throw new NotFoundException('No account found with this email address.');
    }

    // The temp password was stored (hashed) in the password field when forgotPassword was called
    const isValid = await bcrypt.compare(tempPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('The temporary password you entered is incorrect.');
    }

    // Set the new password and clear the forced-change flag
    const hashedNew = await bcrypt.hash(newPassword, 10);
    user.password           = hashedNew;
    user.mustChangePassword  = false;
    // Invalidate any outstanding sessions so the new password is the only way in
    user.lastLogoutAt       = new Date();
    await this.userRepository.save(user);

    // Issue a fresh JWT so the user lands on their dashboard directly
    const token = this.generateToken(user.id, user.email, user.role, user.contactNumber);

    return {
      token,
      user: {
        id:                 user.id,
        fullName:           user.fullName,
        email:              user.email,
        role:               user.role,
        contactNumber:      user.contactNumber,
        mustChangePassword: false,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private helpers
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