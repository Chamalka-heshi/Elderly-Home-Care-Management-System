import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { FamilyService } from '../family/family.service';
import { DoctorsService } from '../doctors/doctors.service';
import { CaregiversService } from '../caregivers/caregivers.service';
import { PatientsService } from '../patients/patients.service';
import { AdminService } from '../admin/admin.service';
import { MailService } from '../mail/mail.service';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { ContactService } from '../contact/contact.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIdWithPassword: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
    updatePassword: jest.fn(),
    setMustChangePassword: jest.fn(),
    deactivateUser: jest.fn(),
    setLastLogoutAt: jest.fn(),
    updateAvatar: jest.fn(),
    update: jest.fn(),
    incrementFailedLoginAttempts: jest.fn(),
    resetFailedLoginAttempts: jest.fn(),
  };

  const mockFamilyService = { create: jest.fn(), findByUserId: jest.fn() };
  const mockDoctorsService = { findByUserId: jest.fn() };
  const mockCaregiversService = { findByUserId: jest.fn() };
  const mockPatientsService = { findByUserId: jest.fn() };
  const mockAdminService = { findByUserId: jest.fn() };
  const mockMailService = { sendPasswordResetEmail: jest.fn(), sendLoginNotificationEmail: jest.fn() };
  const mockFirebaseAdmin = { verifyIdToken: jest.fn() };
  const mockJwtService = { sign: jest.fn() };
  const mockCloudinaryService = {
    uploadFile: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1/ecms/avatars/sample.jpg',
    }),
    deleteFile: jest.fn(),
  };
  const mockContactService = { getInfo: jest.fn() };
  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: FamilyService, useValue: mockFamilyService },
        { provide: DoctorsService, useValue: mockDoctorsService },
        { provide: CaregiversService, useValue: mockCaregiversService },
        { provide: PatientsService, useValue: mockPatientsService },
        { provide: AdminService, useValue: mockAdminService },
        { provide: MailService, useValue: mockMailService },
        { provide: FirebaseAdminService, useValue: mockFirebaseAdmin },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ContactService, useValue: mockContactService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── login ────────────────────────────────────────────────────────────────
  describe('login', () => {
    const dto = { email: 'test@test.com', password: 'pw' };

    it('should return JWT and user on valid credentials', async () => {
      const user = {
        id: 'u1',
        email: 'test@test.com',
        isActive: true,
        role: UserRole.FAMILY,
        mustChangePassword: false,
        contactNumber: '123',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.login(dto);
      expect(result.token).toBe('jwt_token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ isActive: false });
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ isActive: true });
      mockUsersService.validatePassword.mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should pass email as-is to findByEmail without normalization', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await service
        .login({ email: '  UPPER@TEST.COM  ', password: 'pw' })
        .catch(() => {});
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        '  UPPER@TEST.COM  ',
      );
    });
  });

  // ─── familySignup ─────────────────────────────────────────────────────────
  describe('familySignup', () => {
    const dto = {
      email: 'new@test.com',
      password: 'pw',
      fullName: 'New User',
      contactNumber: '123',
    };

    it('should register family member and return token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const user = {
        id: 'u1',
        email: dto.email,
        role: UserRole.FAMILY,
        fullName: dto.fullName,
        contactNumber: dto.contactNumber,
      };
      mockUsersService.create.mockResolvedValue(user);
      mockFamilyService.create.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.familySignup(dto);
      expect(result.token).toBe('jwt_token');
      expect(result.message).toContain('registered');
    });

    it('should throw BadRequestException if email already taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing' });
      await expect(service.familySignup(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a family profile after user creation', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const user = { id: 'u1', role: UserRole.FAMILY };
      mockUsersService.create.mockResolvedValue(user);
      mockFamilyService.create.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('tok');

      await service.familySignup(dto);
      expect(mockFamilyService.create).toHaveBeenCalledWith({ user });
    });
  });

  // ─── getProfile ───────────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('should return FAMILY profile without nested user', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        role: UserRole.FAMILY,
      });
      mockFamilyService.findByUserId.mockResolvedValue({
        id: 'f1',
        user: { id: 'u1' },
      });

      const result = await service.getProfile('u1');
      expect(result.profile.id).toBe('f1');
      expect(result.profile.user).toBeUndefined();
    });

    it('should return DOCTOR profile', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        role: UserRole.DOCTOR,
      });
      mockDoctorsService.findByUserId.mockResolvedValue({
        id: 'd1',
        user: { id: 'u1' },
      });

      const result = await service.getProfile('u1');
      expect(result.profile.id).toBe('d1');
    });

    it('should return ADMIN profile', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        role: UserRole.ADMIN,
      });
      mockAdminService.findByUserId.mockResolvedValue({
        id: 'a1',
        user: { id: 'u1' },
      });

      const result = await service.getProfile('u1');
      expect(result.profile.id).toBe('a1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.getProfile('u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should call setLastLogoutAt', async () => {
      mockUsersService.setLastLogoutAt.mockResolvedValue(undefined);
      await service.logout('u1');
      expect(mockUsersService.setLastLogoutAt).toHaveBeenCalledWith(
        'u1',
        expect.any(Date),
      );
    });
  });

  // ─── deleteAccount ────────────────────────────────────────────────────────
  describe('deleteAccount', () => {
    it('should deactivate user and return success message', async () => {
      mockUsersService.deactivateUser.mockResolvedValue(undefined);
      const result = await service.deleteAccount('u1');
      expect(mockUsersService.deactivateUser).toHaveBeenCalledWith('u1');
      expect(result.message).toContain('deleted');
    });
  });

  // ─── uploadAvatar ─────────────────────────────────────────────────────────
  describe('uploadAvatar', () => {
    const validFile = {
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('img'),
    };

    it('should return a Cloudinary URL and persist it', async () => {
      mockUsersService.updateAvatar.mockResolvedValue(undefined);
      const result = await service.uploadAvatar('u1', validFile);
      expect(result.avatarUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
      expect(mockUsersService.updateAvatar).toHaveBeenCalledWith(
        'u1',
        result.avatarUrl,
      );
    });

    it('should throw BadRequestException for unsupported MIME type', async () => {
      await expect(
        service.uploadAvatar('u1', {
          ...validFile,
          mimetype: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when file exceeds 5 MB', async () => {
      await expect(
        service.uploadAvatar('u1', { ...validFile, size: 6 * 1024 * 1024 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept PNG images and return a Cloudinary URL', async () => {
      mockUsersService.updateAvatar.mockResolvedValue(undefined);
      const result = await service.uploadAvatar('u1', {
        ...validFile,
        mimetype: 'image/png',
      });
      expect(result.avatarUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    });
  });

  // ─── removeAvatar ─────────────────────────────────────────────────────────
  describe('removeAvatar', () => {
    it('should set avatar to null', async () => {
      mockUsersService.updateAvatar.mockResolvedValue(undefined);
      await service.removeAvatar('u1');
      expect(mockUsersService.updateAvatar).toHaveBeenCalledWith('u1', null);
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────
  describe('changePassword', () => {
    it('should update password when current password is correct', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue({
        id: 'u1',
        password: 'hashed',
      });
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.updatePassword.mockResolvedValue(undefined);
      mockUsersService.setMustChangePassword.mockResolvedValue(undefined);

      await service.changePassword('u1', 'currentPw', 'newPw');
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        'u1',
        'newPw',
      );
      expect(mockUsersService.setMustChangePassword).toHaveBeenCalledWith(
        'u1',
        false,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue(null);
      await expect(service.changePassword('u1', 'old', 'new')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue({
        id: 'u1',
        password: 'hashed',
      });
      mockUsersService.validatePassword.mockResolvedValue(false);
      await expect(
        service.changePassword('u1', 'wrong', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── firstLoginChangePassword ─────────────────────────────────────────────
  describe('firstLoginChangePassword', () => {
    it('should change password on first login', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        mustChangePassword: true,
      });
      mockUsersService.updatePassword.mockResolvedValue(undefined);
      mockUsersService.setMustChangePassword.mockResolvedValue(undefined);

      await service.firstLoginChangePassword('u1', 'newPw');
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        'u1',
        'newPw',
      );
      expect(mockUsersService.setMustChangePassword).toHaveBeenCalledWith(
        'u1',
        false,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(
        service.firstLoginChangePassword('u1', 'pw'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when mustChangePassword is false', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        mustChangePassword: false,
      });
      await expect(
        service.firstLoginChangePassword('u1', 'pw'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── checkEmailForReset ───────────────────────────────────────────────────
  describe('checkEmailForReset', () => {
    it('should return masked contact number', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        isActive: true,
        contactNumber: '+94712345678',
      });
      const result = await service.checkEmailForReset('test@test.com');
      expect(result.maskedContact).toMatch(/^\*+678$/);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.checkEmailForReset('no@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user is inactive', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ isActive: false });
      await expect(service.checkEmailForReset('test@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when no contact number on account', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        isActive: true,
        contactNumber: '',
      });
      await expect(service.checkEmailForReset('test@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    const user = {
      id: 'u1',
      email: 'test@test.com',
      fullName: 'Test',
      isActive: true,
      contactNumber: '+94712345678',
      password: '',
      mustChangePassword: false,
    };

    it('should send reset email when credentials match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUserRepo.save.mockResolvedValue(user);
      mockMailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword(
        'test@test.com',
        '+94712345678',
      );
      expect(result.message).toContain('temporary password');
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.forgotPassword('no@test.com', '123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when contact does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(user);
      await expect(
        service.forgotPassword('test@test.com', 'WRONG'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should set mustChangePassword to true in saved user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ ...user });
      mockUserRepo.save.mockImplementation(async (u) => u);
      mockMailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@test.com', '+94712345678');
      const savedUser = mockUserRepo.save.mock.calls[0][0];
      expect(savedUser.mustChangePassword).toBe(true);
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('should throw BadRequestException when passwords do not match', async () => {
      await expect(
        service.resetPassword('test@test.com', 'temp', 'newPw', 'different'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.resetPassword('no@test.com', 'temp', 'pw', 'pw'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is inactive', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ isActive: false });
      await expect(
        service.resetPassword('test@test.com', 'temp', 'pw', 'pw'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── firebaseAuth ─────────────────────────────────────────────────────────
  describe('firebaseAuth', () => {
    it('should throw UnauthorizedException for invalid Firebase token', async () => {
      mockFirebaseAdmin.verifyIdToken.mockRejectedValue(
        new Error('invalid token'),
      );
      await expect(service.firebaseAuth('bad_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when Firebase token has no email', async () => {
      mockFirebaseAdmin.verifyIdToken.mockResolvedValue({
        uid: 'fb1',
        name: 'Name',
        picture: null,
      });
      await expect(service.firebaseAuth('token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when existing user is inactive', async () => {
      mockFirebaseAdmin.verifyIdToken.mockResolvedValue({
        uid: 'fb1',
        email: 'test@test.com',
        name: 'Name',
      });
      mockUserRepo.findOne.mockResolvedValue({
        email: 'test@test.com',
        isActive: false,
      });
      await expect(service.firebaseAuth('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return a token for existing active user and isNewUser=false', async () => {
      const existingUser = {
        id: 'u1',
        email: 'test@test.com',
        fullName: 'Name',
        isActive: true,
        role: UserRole.FAMILY,
        contactNumber: '',
        mustChangePassword: false,
      };
      mockFirebaseAdmin.verifyIdToken.mockResolvedValue({
        uid: 'fb1',
        email: 'test@test.com',
        name: 'Name',
      });
      mockUserRepo.findOne.mockResolvedValue(existingUser);
      mockFamilyService.findByUserId.mockResolvedValue({ id: 'f1' });
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.firebaseAuth('token');
      expect(result.token).toBe('jwt_token');
      expect(result.isNewUser).toBe(false);
    });
  });
});
