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
import { UserRole } from '../../common/enums/user-role.enum';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { MailService } from '../mail/mail.service';
import { ContactService } from '../contact/contact.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { SECURITY_CONSTANTS } from '../../common/constants/security.constants';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly familyService: FamilyService,
    private readonly doctorsService: DoctorsService,
    private readonly caregiversService: CaregiversService,
    private readonly patientsService: PatientsService,
    private readonly jwtService: JwtService,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly adminService: AdminService,
    private readonly mailService: MailService,
    private readonly contactService: ContactService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Registration
  // Handles family member registration by creating both a core user identity and a family-specific profile.
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
        mustChangePassword: false,
      },
      token,
    };
  }

  // Authentication
  // Verifies credentials and activation status before issuing a session token to grant platform access.
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        'No account found with this email address.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact support.',
      );
    }

    // Check if account is locked due to too many failed attempts
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account locked due to too many failed login attempts. Try again in 15 minutes.',
      );
    }

    // Reset lock if lockout period has expired
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedLoginAttempts(user.id);
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.usersService.incrementFailedLoginAttempts(user.id);
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    // Reset failed login attempts on successful login
    await this.usersService.resetFailedLoginAttempts(user.id);

    const token = this.generateToken(user.id, user.email, user.role);

    // Send login security notification to privileged roles only (fire-and-forget)
    const privilegedRoles = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.DOCTOR,
      UserRole.CAREGIVER,
    ];
    if (privilegedRoles.includes(user.role)) {
      const loginTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
      });

      // Non-blocking — notification failure must never reject the login
      void (async () => {
        // Fetch live facility contact details; fall back gracefully if not configured
        let phone = '';
        let contactEmail = '';
        try {
          const info = await this.contactService.getInfo();
          phone = info.phonePrimary ?? '';
          contactEmail = info.email ?? '';
        } catch {
          // contact_info row may not exist yet — silently ignore
        }

        await this.mailService.sendLoginNotificationEmail(
          user.email,
          user.fullName,
          { role: user.role, loginTime, phone, contactEmail },
        );
      })();
    }

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        mustChangePassword: user.mustChangePassword,
        avatarUrl: user.avatarUrl ?? null,
      },
      token,
    };
  }

  // Profile & Session
  // Aggregates core identity data with role-specific profile attributes for a complete user overview.
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strips the nested `user` relation before returning role-specific profile data
    const stripUser = (entity: any) => {
      if (!entity) return null;
      const copy = { ...entity };
      delete copy.user;
      return copy;
    };

    let profileData = null;

    switch (user.role) {
      case UserRole.FAMILY:
        profileData = stripUser(await this.familyService.findByUserId(user.id));
        break;
      case UserRole.DOCTOR:
        profileData = stripUser(
          await this.doctorsService.findByUserId(user.id),
        );
        break;
      case UserRole.CAREGIVER:
        profileData = stripUser(
          await this.caregiversService.findByUserId(user.id),
        );
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

  // Marks the point in time after which any previously issued tokens are considered invalid for safety.
  async logout(userId: string): Promise<void> {
    await this.usersService.setLastLogoutAt(userId, new Date());
  }

  // Disables the user's account to prevent further access while preserving historical data records.
  async deleteAccount(userId: string) {
    await this.usersService.deactivateUser(userId);
    return { message: 'Account deleted successfully' };
  }

  // Synchronizes external Firebase identities with the local user database, creating new profiles if necessary.
  async firebaseAuth(
    idToken: string,
  ): Promise<{ token: string; user: any; isNewUser: boolean }> {
    let decodedToken: Awaited<
      ReturnType<FirebaseAdminService['verifyIdToken']>
    >;

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

    // Only FAMILY accounts may use Google login.
    // Admin, Doctor, and Caregiver accounts are created by the admin and are
    // password-only — blocking Google login prevents unauthorized access.
    if (user && user.role !== UserRole.FAMILY) {
      throw new UnauthorizedException(
        'Google sign-in is not available for this account. Please use your email and password to log in.',
      );
    }

    if (!user) {
      user = this.userRepository.create({
        email,
        fullName: name ?? email.split('@')[0],
        password: `FIREBASE_OAUTH::${crypto.randomBytes(32).toString('hex')}`,
        role: UserRole.FAMILY,
        contactNumber: '',
        firebaseUid: uid,
        avatarUrl: picture ?? null,
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

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        mustChangePassword: user.mustChangePassword,
        avatarUrl: user.avatarUrl ?? null,
      },
      isNewUser,
    };
  }

  // Validates the file and uploads the image buffer to Cloudinary, then persists the returned secure CDN URL in the database.
  async uploadAvatar(
    userId: string,
    file: { mimetype: string; size: number; buffer: Buffer },
  ): Promise<{ avatarUrl: string }> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP, or GIF images are allowed',
      );
    }
    if (file.size > maxFileSizeBytes) {
      throw new BadRequestException('Avatar image must be smaller than 5 MB');
    }

    const result = await this.cloudinaryService.uploadFile(file, 'ecms/avatars');
    const avatarUrl = result.secure_url;

    await this.usersService.updateAvatar(userId, avatarUrl);
    return { avatarUrl };
  }

  // Clears the avatar reference to return the user profile to its default state.
  async removeAvatar(userId: string): Promise<void> {
    await this.usersService.updateAvatar(userId, null);
  }

  // Password Security

  // Replaces the existing password with a new hash after verifying the user's current credentials.
  async changePassword(
    userId: string,
    currentPw: string,
    newPw: string,
  ): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await this.usersService.validatePassword(
      currentPw,
      user.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.updatePassword(userId, newPw);
    await this.usersService.setMustChangePassword(userId, false);
  }

  // Forces a new permanent password set for users loggin in with temporary system-generated credentials.
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

  // Password Recovery
  // Validates a reset request and provides a masked phone number hint to the user for confirmation.
  async checkEmailForReset(email: string): Promise<{ maskedContact: string }> {
    const user = await this.usersService.findByEmail(
      email.trim().toLowerCase(),
    );

    // Generic message — avoids revealing whether the email is registered
    if (!user || !user.isActive) {
      throw new NotFoundException('No account found with this email address.');
    }

    if (!user.contactNumber || user.contactNumber.trim().length < 3) {
      throw new BadRequestException(
        'No contact number is associated with this account. Please contact support.',
      );
    }

    // Mask all but the last 3 digits: "+947123456789" → "**********789"
    const contact = user.contactNumber.trim();
    const masked = '*'.repeat(contact.length - 3) + contact.slice(-3);

    return { maskedContact: masked };
  }

  // Issues a temporary random password to the user's registered email after verifying their identity via contact number.
  async forgotPassword(
    email: string,
    contactNumber: string,
  ): Promise<{ message: string }> {
    const normEmail = email.trim().toLowerCase();
    const normContact = contactNumber.trim();

    const user = await this.usersService.findByEmail(normEmail);
    if (!user || !user.isActive) {
      throw new NotFoundException('No account found with this email address.');
    }

    if (!user.contactNumber || user.contactNumber.trim().length < 3) {
      throw new BadRequestException(
        'Contact number not on record. Please contact support.',
      );
    }

    // Masking is display-only — verify the full number for security
    if (user.contactNumber.trim() !== normContact) {
      throw new UnauthorizedException(
        'The contact number you entered does not match our records.',
      );
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashed = await bcrypt.hash(
      tempPassword,
      SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS,
    );

    user.password = hashed;
    user.mustChangePassword = true;
    await this.userRepository.save(user);

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

  // Authenticates with a temporary credential and sets a new permanent password, resetting the security session.
  async resetPassword(
    email: string,
    tempPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ token: string; user: any }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match.',
      );
    }

    const normEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normEmail);

    if (!user || !user.isActive) {
      throw new NotFoundException('No account found with this email address.');
    }

    const isValid = await bcrypt.compare(tempPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException(
        'The temporary password you entered is incorrect.',
      );
    }

    const hashedNew = await bcrypt.hash(
      newPassword,
      SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS,
    );

    user.password = hashedNew;
    user.mustChangePassword = false;
    // Invalidate all outstanding sessions so only the new password grants access
    user.lastLogoutAt = new Date();
    await this.userRepository.save(user);

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        mustChangePassword: false,
      },
    };
  }

  // Encodes user identity and role into a secure JWT for platform-wide authorization.
  private generateToken(userId: string, email: string, role: UserRole): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  // Generate a CSRF token for form submissions and state-changing operations
  generateCsrfToken(): string {
    return CsrfGuard.generateToken();
  }
}
