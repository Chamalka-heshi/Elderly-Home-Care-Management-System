import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CaregiversService } from './caregivers.service';
import { Caregiver } from './entities/caregiver.entity';
import { UsersService } from '../users/users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CaregiversService', () => {
  let service: CaregiversService;

  const mockCaregiverRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    activateUser: jest.fn(),
    deactivateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaregiversService,
        { provide: getRepositoryToken(Caregiver), useValue: mockCaregiverRepo },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<CaregiversService>(CaregiversService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      email: 'care@test.com',
      password: 'pw123',
      fullName: 'Caregiver 1',
      nic: '12345',
    } as any;

    it('should create a caregiver successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockCaregiverRepo.findOne.mockResolvedValue(null);

      const mockUser = { id: 'u1' };
      mockUsersService.create.mockResolvedValue(mockUser);
      mockCaregiverRepo.create.mockReturnValue({ user: mockUser });
      mockCaregiverRepo.save.mockResolvedValue({ id: 'c1' });

      const result = await service.create(createDto);
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if NIC exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockCaregiverRepo.findOne.mockResolvedValue({ id: 'c1' });
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProfileByUserId', () => {
    it('should update caregiver and user', async () => {
      mockCaregiverRepo.findOne.mockResolvedValue({
        id: 'c1',
        user: { id: 'u1' },
      });
      mockCaregiverRepo.save.mockResolvedValue(true);

      await service.updateProfileByUserId('u1', {
        experienceYears: 5,
        fullName: 'New Name',
      });

      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockCaregiverRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCaregiverRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfileByUserId('u1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
