import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken }  from '@nestjs/typeorm';
import { UsersService }        from './users.service';
import { User }                from './entities/user.entity';
import { UserRole }            from '../../common/enums/user-role.enum';
import { NotFoundException }   from '@nestjs/common';
import * as bcrypt             from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepo = {
    create: jest.fn(),
    save:   jest.fn(),
    findOne: jest.fn(),
    update:  jest.fn(),
    delete:  jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where:     jest.fn().mockReturnThis(),
    getOne:    jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockUserRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash password and create user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPw');
      mockUserRepo.create.mockReturnValue({ email: 'test@test.com' });
      mockUserRepo.save.mockResolvedValue({ id: 'u1', email: 'test@test.com' });

      const result = await service.create('test@test.com', 'password', UserRole.FAMILY, 'John');
      expect(result.id).toEqual('u1');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(mockUserRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user with password', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ id: 'u1' });
      const result = await service.findByEmail('test@test.com');
      expect(result?.id).toEqual('u1');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.password');
    });
  });

  describe('validatePassword', () => {
    it('should call bcrypt compare', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validatePassword('plain', 'hashed');
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
    });
  });

  describe('updatePassword', () => {
    it('should update password if user found', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'u1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');
      
      await service.updatePassword('u1', 'newPw');
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ password: 'newHashed' }));
    });

    it('should throw NotFoundException if not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.updatePassword('u1', 'newPw')).rejects.toThrow(NotFoundException);
    });
  });

  describe('activation and deactivation', () => {
    it('should deactivate user', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'u1', isActive: true });
      await service.deactivateUser('u1');
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('should activate user', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'u1', isActive: false });
      await service.activateUser('u1');
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
    });

    it('should throw NotFoundException when deactivating non-existent user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.deactivateUser('u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when activating non-existent user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.activateUser('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'u1', email: 'test@test.com' });
      const result = await service.findById('u1');
      expect(result?.id).toBe('u1');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('should return null when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const result = await service.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByIdWithPassword', () => {
    it('should return user with password selected', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ id: 'u1', password: 'hashed' });
      const result = await service.findByIdWithPassword('u1');
      expect(result?.id).toBe('u1');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.password');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.id = :id', { id: 'u1' });
    });

    it('should return null when user not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      const result = await service.findByIdWithPassword('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('setMustChangePassword', () => {
    it('should call update with mustChangePassword flag', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      await service.setMustChangePassword('u1', true);
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', { mustChangePassword: true });
    });

    it('should call update to clear mustChangePassword flag', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      await service.setMustChangePassword('u1', false);
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', { mustChangePassword: false });
    });
  });

  describe('setLastLogoutAt', () => {
    it('should update lastLogoutAt with a date', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      const date = new Date('2024-01-01T00:00:00Z');
      await service.setLastLogoutAt('u1', date);
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', { lastLogoutAt: date });
    });

    it('should update lastLogoutAt with null to clear it', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      await service.setLastLogoutAt('u1', null);
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', { lastLogoutAt: null });
    });
  });

  describe('deleteUser', () => {
    it('should delete user when found', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'u1' });
      mockUserRepo.delete.mockResolvedValue(undefined);
      await service.deleteUser('u1');
      expect(mockUserRepo.delete).toHaveBeenCalledWith('u1');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteUser('u1')).rejects.toThrow(NotFoundException);
      expect(mockUserRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user fullName and contactNumber', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      await service.update('u1', { fullName: 'Jane Doe', contactNumber: '0771234567' });
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', {
        fullName: 'Jane Doe',
        contactNumber: '0771234567',
      });
    });

    it('should update only provided fields', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      await service.update('u1', { fullName: 'Only Name' });
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', { fullName: 'Only Name' });
    });
  });

  describe('updateAvatar', () => {
    it('should update avatarUrl with a new URL', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      await service.updateAvatar('u1', 'https://cdn.example.com/avatar.png');
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', {
        avatarUrl: 'https://cdn.example.com/avatar.png',
      });
    });

    it('should clear avatarUrl when null is passed', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      await service.updateAvatar('u1', null);
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', { avatarUrl: null });
    });
  });
});