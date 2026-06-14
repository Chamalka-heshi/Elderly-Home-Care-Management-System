import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { VitalRecord } from '../caregivers/entities/vital-record.entity';
import { Prescription } from '../prescription/entities/prescription.entity';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

describe('PatientsService', () => {
  let service: PatientsService;

  const mockPatientRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFamilyRepo = {
    findOne: jest.fn(),
  };

  const mockVitalRepo = {
    find: jest.fn(),
  };

  const mockPrescriptionRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepo },
        { provide: getRepositoryToken(FamilyMember), useValue: mockFamilyRepo },
        { provide: getRepositoryToken(VitalRecord), useValue: mockVitalRepo },
        {
          provide: getRepositoryToken(Prescription),
          useValue: mockPrescriptionRepo,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: any = { fullName: 'Test Patient', nic: '123' };

    it('should create patient', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockPatientRepo.create.mockReturnValue(dto);
      mockPatientRepo.save.mockResolvedValue({ id: 'p1', ...dto });

      const result = await service.create('f1', dto);
      expect(result.id).toEqual('p1');
    });

    it('should throw ConflictException on duplicate NIC', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockPatientRepo.create.mockReturnValue(dto);

      const error = new QueryFailedError('query', [], new Error(''));
      (error as any).code = '23505';
      mockPatientRepo.save.mockRejectedValue(error);

      await expect(service.create('f1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOneByFamily', () => {
    it('should find patient', async () => {
      mockPatientRepo.findOne.mockResolvedValue({
        id: 'p1',
        familyMemberId: 'f1',
      });
      const result = await service.findOneByFamily('p1', 'f1');
      expect(result.id).toBe('p1');
    });

    it('should throw NotFoundException if not belong to family', async () => {
      mockPatientRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneByFamily('p1', 'f1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update if authorized', async () => {
      mockPatientRepo.findOne.mockResolvedValue({
        id: 'p1',
        familyMemberId: 'f1',
      });
      mockPatientRepo.update.mockResolvedValue(true);

      await service.update('p1', 'f1', { fullName: 'Updated' });
      expect(mockPatientRepo.update).toHaveBeenCalledWith('p1', {
        fullName: 'Updated',
      });
    });

    it('should throw ForbiddenException if unauthorized', async () => {
      mockPatientRepo.findOne.mockResolvedValue({
        id: 'p1',
        familyMemberId: 'f2',
      });
      await expect(service.update('p1', 'f1', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMedicalHistory', () => {
    it('should return combined medical history', async () => {
      mockPatientRepo.findOne.mockResolvedValue({ id: 'p1' });
      mockVitalRepo.find.mockResolvedValue([{ id: 'v1' }]);
      mockPrescriptionRepo.find.mockResolvedValue([{ id: 'rx1' }]);

      const result = await service.getMedicalHistory('p1');
      expect(result.patient.id).toBe('p1');
      expect(result.vitalRecords.length).toBe(1);
      expect(result.prescriptions.length).toBe(1);
    });
  });
});
