import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken }  from '@nestjs/typeorm';
import { AdminService }        from './admin.service';
import { Admin }               from './entities/admin.entity';
import { Patient }             from '../patients/entities/patient.entity';
import { Doctor }              from '../doctors/entities/doctor.entity';
import { Caregiver }           from '../caregivers/entities/caregiver.entity';
import { FamilyMember }        from '../family/entities/family-member.entity';
import { UsersService }        from '../users/users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole }            from '../../common/enums/user-role.enum';

describe('AdminService', () => {
  let service: AdminService;

  const mockAdminRepo = {
    create:  jest.fn(),
    save:    jest.fn(),
    findOne: jest.fn(),
    find:    jest.fn(),
    count:   jest.fn(),
    remove:  jest.fn(),
  };

  const mockPatientRepo = {
    find:    jest.fn(),
    findOne: jest.fn(),
    count:   jest.fn(),
    remove:  jest.fn(),
  };

  const mockDoctorRepo     = { count: jest.fn() };
  const mockCaregiverRepo  = { count: jest.fn() };

  const mockFamilyRepo = {
    find:    jest.fn(),
    count:   jest.fn(),
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findByEmail:    jest.fn(),
    create:         jest.fn(),
    findById:       jest.fn(),
    deleteUser:     jest.fn(),
    update:         jest.fn(),
    activateUser:   jest.fn(),
    deactivateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(Admin),        useValue: mockAdminRepo },
        { provide: getRepositoryToken(Patient),      useValue: mockPatientRepo },
        { provide: getRepositoryToken(Doctor),       useValue: mockDoctorRepo },
        { provide: getRepositoryToken(Caregiver),    useValue: mockCaregiverRepo },
        { provide: getRepositoryToken(FamilyMember), useValue: mockFamilyRepo },
        { provide: UsersService,                     useValue: mockUsersService },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      email: 'admin@test.com', password: 'pw123',
      fullName: 'Admin User', contactNumber: '1234', nic: '123456789V',
    };

    it('should create an admin successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockAdminRepo.findOne.mockResolvedValue(null);
      const user = { id: 'u1', email: dto.email };
      mockUsersService.create.mockResolvedValue(user);
      mockAdminRepo.create.mockReturnValue({ user, nic: dto.nic });
      mockAdminRepo.save.mockResolvedValue({ id: 'a1', user, nic: dto.nic });

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockUsersService.create).toHaveBeenCalledWith(
        dto.email, dto.password, UserRole.ADMIN, dto.fullName, dto.contactNumber
      );
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when NIC already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockAdminRepo.findOne.mockResolvedValue({ id: 'a1' });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all admins with user relation', async () => {
      const admins = [{ id: 'a1', user: { id: 'u1', fullName: 'Admin' } }];
      mockAdminRepo.find.mockResolvedValue(admins);

      const result = await service.findAll();
      expect(result).toEqual(admins);
      expect(mockAdminRepo.find).toHaveBeenCalledWith(expect.objectContaining({ relations: ['user'] }));
    });
  });

  // ─── findByUserId ─────────────────────────────────────────────────────────
  describe('findByUserId', () => {
    it('should return admin record for valid user id', async () => {
      mockAdminRepo.findOne
        .mockResolvedValueOnce({ id: 'a1' })
        .mockResolvedValueOnce({ id: 'a1', user: { id: 'u1' } });

      const result = await service.findByUserId('u1');
      expect(result.id).toBe('a1');
    });

    it('should throw NotFoundException when admin not found', async () => {
      mockAdminRepo.findOne.mockResolvedValue(null);
      await expect(service.findByUserId('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteAdmin ──────────────────────────────────────────────────────────
  describe('deleteAdmin', () => {
    it('should delete admin via usersService.deleteUser', async () => {
      mockAdminRepo.findOne.mockResolvedValue({ id: 'a1', user: { id: 'u1' } });
      await service.deleteAdmin('a1');
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith('u1');
    });

    it('should throw NotFoundException when admin not found', async () => {
      mockAdminRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteAdmin('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getDashboardStats ────────────────────────────────────────────────────
  describe('getDashboardStats', () => {
    it('should return combined statistics from all repos', async () => {
      mockFamilyRepo.count.mockResolvedValue(10);
      mockPatientRepo.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15);
      mockAdminRepo.count.mockResolvedValue(2);
      mockDoctorRepo.count.mockResolvedValue(5);
      mockCaregiverRepo.count.mockResolvedValue(8);

      const stats = await service.getDashboardStats();
      expect(stats).toEqual({
        totalFamilies:  10,
        totalPatients:  20,
        activePatients: 15,
        totalDoctors:   5,
        totalCaregivers: 8,
        totalAdmins:    2,
      });
    });
  });

  // ─── getAllFamilies ────────────────────────────────────────────────────────
  describe('getAllFamilies', () => {
    it('should return mapped family list with patient counts', async () => {
      const families = [{
        id: 'f1',
        user: { fullName: 'Fam One', email: 'fam@test.com', contactNumber: '123', isActive: true, createdAt: new Date() },
        patients: [{ id: 'p1' }, { id: 'p2' }],
      }];
      mockFamilyRepo.find.mockResolvedValue(families);

      const result = await service.getAllFamilies();
      expect(result.total).toBe(1);
      expect(result.families[0].fullName).toBe('Fam One');
      expect(result.families[0].patientsCount).toBe(2);
    });

    it('should return zero patients when no patients associated', async () => {
      const families = [{
        id: 'f1',
        user: { fullName: 'Fam', email: 'f@test.com', contactNumber: '1', isActive: true, createdAt: new Date() },
        patients: [],
      }];
      mockFamilyRepo.find.mockResolvedValue(families);
      const result = await service.getAllFamilies();
      expect(result.families[0].patientsCount).toBe(0);
    });
  });

  // ─── toggleFamilyStatus ───────────────────────────────────────────────────
  describe('toggleFamilyStatus', () => {
    it('should activate user when isActive is true', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1', user: { id: 'u1', fullName: 'Fam' } });
      const result = await service.toggleFamilyStatus('f1', true);
      expect(mockUsersService.activateUser).toHaveBeenCalledWith('u1');
      expect(result.isActive).toBe(true);
    });

    it('should deactivate user when isActive is false', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1', user: { id: 'u1', fullName: 'Fam' } });
      const result = await service.toggleFamilyStatus('f1', false);
      expect(mockUsersService.deactivateUser).toHaveBeenCalledWith('u1');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when family not found', async () => {
      mockFamilyRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleFamilyStatus('missing', true)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getAllPatients ────────────────────────────────────────────────────────
  describe('getAllPatients', () => {
    it('should map and return patients with family names', async () => {
      const patients = [
        { id: 'p1', fullName: 'Patient A', familyMember: { user: { fullName: 'Family A' } } },
      ];
      mockPatientRepo.find.mockResolvedValue(patients);

      const result = await service.getAllPatients();
      expect(result.total).toBe(1);
      expect(result.patients[0].fullName).toBe('Patient A');
      expect(result.patients[0].familyName).toBe('Family A');
    });

    it('should return empty list when no patients exist', async () => {
      mockPatientRepo.find.mockResolvedValue([]);
      const result = await service.getAllPatients();
      expect(result.total).toBe(0);
      expect(result.patients).toHaveLength(0);
    });
  });

  // ─── getPatientById ───────────────────────────────────────────────────────
  describe('getPatientById', () => {
    it('should return mapped patient', async () => {
      const patient = { id: 'p1', fullName: 'Patient', familyMember: { user: { fullName: 'Fam' } } };
      mockPatientRepo.findOne.mockResolvedValue(patient);

      const result = await service.getPatientById('p1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPatientRepo.findOne.mockResolvedValue(null);
      await expect(service.getPatientById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deletePatient ────────────────────────────────────────────────────────
  describe('deletePatient', () => {
    it('should remove patient record', async () => {
      const patient = { id: 'p1' };
      mockPatientRepo.findOne.mockResolvedValue(patient);
      mockPatientRepo.remove.mockResolvedValue(patient);

      await service.deletePatient('p1');
      expect(mockPatientRepo.remove).toHaveBeenCalledWith(patient);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepo.findOne.mockResolvedValue(null);
      await expect(service.deletePatient('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateProfileByUserId ────────────────────────────────────────────────
  describe('updateProfileByUserId', () => {
    it('should update admin profile and return updated data', async () => {
      mockAdminRepo.findOne.mockResolvedValue({ id: 'a1' });
      mockUsersService.update.mockResolvedValue(true);
      mockUsersService.findById.mockResolvedValue({ id: 'u1', fullName: 'New Name', contactNumber: '999' });

      const result = await service.updateProfileByUserId('u1', { fullName: 'New Name' });
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when admin profile not found', async () => {
      mockAdminRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfileByUserId('missing', { fullName: 'X' })).rejects.toThrow(NotFoundException);
    });
  });
});