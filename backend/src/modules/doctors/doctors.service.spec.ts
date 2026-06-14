import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { Doctor } from './entities/doctor.entity';
import { Prescription } from '../prescription/entities/prescription.entity';
import { ChannelingSlot } from '../channeling-slot/entities/channeling-slot.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UsersService } from '../users/users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';

describe('DoctorsService', () => {
  let service: DoctorsService;

  const mockApptQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getMany: jest.fn(),
  };

  const mockDoctorRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockApptQueryBuilder),
  };

  const mockPrescriptionRepo = { count: jest.fn() };
  const mockSlotRepo = { count: jest.fn() };
  const mockApptRepo = { createQueryBuilder: jest.fn() };

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
        DoctorsService,
        { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepo },
        {
          provide: getRepositoryToken(Prescription),
          useValue: mockPrescriptionRepo,
        },
        { provide: getRepositoryToken(ChannelingSlot), useValue: mockSlotRepo },
        { provide: getRepositoryToken(Appointment), useValue: mockApptRepo },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();
    service = module.get<DoctorsService>(DoctorsService);
    mockApptRepo.createQueryBuilder.mockReturnValue(mockApptQueryBuilder);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      email: 'doc@test.com',
      password: 'pw123',
      fullName: 'Dr. John',
      specialization: 'Cardiology',
      licenseNumber: 'LIC123',
    } as any;

    it('should create a doctor successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const user = { id: 'u1' };
      mockUsersService.create.mockResolvedValue(user);
      mockDoctorRepo.create.mockReturnValue({
        user,
        specialization: 'Cardiology',
      });
      mockDoctorRepo.save.mockResolvedValue({ id: 'd1' });

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockUsersService.create).toHaveBeenCalledWith(
        'doc@test.com',
        'pw123',
        UserRole.DOCTOR,
        'Dr. John',
        undefined,
      );
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all doctors with user relation', async () => {
      const doctors = [{ id: 'd1', user: { id: 'u1' } }];
      mockDoctorRepo.find.mockResolvedValue(doctors);

      const result = await service.findAll();
      expect(result).toEqual(doctors);
      expect(mockDoctorRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['user'] }),
      );
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a doctor by id', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'd1',
        user: { id: 'u1' },
      });
      const result = await service.findOne('d1');
      expect(result.id).toBe('d1');
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findByUserId ─────────────────────────────────────────────────────────
  describe('findByUserId', () => {
    it('should find doctor by user id', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      const result = await service.findByUserId('u1');
      expect(result.id).toBe('d1');
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.findByUserId('u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── activate / deactivate ────────────────────────────────────────────────
  describe('activate', () => {
    it('should activate doctor via usersService', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'd1',
        user: { id: 'u1' },
      });
      await service.activate('d1');
      expect(mockUsersService.activateUser).toHaveBeenCalledWith('u1');
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.activate('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate doctor via usersService', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'd1',
        user: { id: 'u1' },
      });
      await service.deactivate('d1');
      expect(mockUsersService.deactivateUser).toHaveBeenCalledWith('u1');
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.deactivate('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getDashboardStats ────────────────────────────────────────────────────
  describe('getDashboardStats', () => {
    it('should return aggregated stats for the doctor', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'd1',
        user: { id: 'u1' },
      });
      mockApptQueryBuilder.getRawOne.mockResolvedValue({ count: '5' });
      mockSlotRepo.count.mockResolvedValue(2);
      mockPrescriptionRepo.count.mockResolvedValue(3);
      mockApptQueryBuilder.getMany.mockResolvedValue([]);

      const stats = await service.getDashboardStats('u1');
      expect(stats.myPatientsCount).toBe(5);
      expect(stats.todaysAppointmentsCount).toBe(2);
      expect(stats.activePrescriptionsCount).toBe(3);
      expect(stats.recentPatients).toEqual([]);
    });

    it('should handle zero patients gracefully', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'd1',
        user: { id: 'u1' },
      });
      mockApptQueryBuilder.getRawOne.mockResolvedValue(null);
      mockSlotRepo.count.mockResolvedValue(0);
      mockPrescriptionRepo.count.mockResolvedValue(0);
      mockApptQueryBuilder.getMany.mockResolvedValue([]);

      const stats = await service.getDashboardStats('u1');
      expect(stats.myPatientsCount).toBe(0);
    });
  });

  // ─── updateProfileByUserId ────────────────────────────────────────────────
  describe('updateProfileByUserId', () => {
    it('should update doctor and user profile', async () => {
      const doctor = { id: 'd1', specialization: 'Old' };
      mockDoctorRepo.findOne.mockResolvedValue(doctor);
      mockUsersService.update.mockResolvedValue(true);
      mockDoctorRepo.save.mockResolvedValue({
        ...doctor,
        specialization: 'New',
      });
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        fullName: 'Dr. Name',
      });

      const result = await service.updateProfileByUserId('u1', {
        specialization: 'New',
        fullName: 'Dr. Name',
      });
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result.profile.specialization).toBe('New');
    });

    it('should throw NotFoundException when doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateProfileByUserId('missing', { specialization: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── setAvailability ──────────────────────────────────────────────────────
  describe('setAvailability', () => {
    it('should update availability fields on doctor record', async () => {
      const doctor = {
        id: 'd1',
        availableDays: [],
        availableTimeStart: '',
        availableTimeEnd: '',
      };
      mockDoctorRepo.findOne.mockResolvedValue(doctor);
      mockDoctorRepo.save.mockImplementation(async (d) => d);

      const result = await service.setAvailability(
        'u1',
        ['Monday', 'Wednesday'],
        '09:00',
        '17:00',
      );
      expect(result.availableDays).toEqual(['Monday', 'Wednesday']);
      expect(result.availableTimeStart).toBe('09:00');
      expect(result.availableTimeEnd).toBe('17:00');
    });

    it('should throw NotFoundException when doctor profile not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(
        service.setAvailability('u1', [], '09:00', '17:00'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
