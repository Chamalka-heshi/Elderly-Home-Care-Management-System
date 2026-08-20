import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { Gender } from './dto/create-patient.dto';
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
    createQueryBuilder: jest.fn(),
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
    it('should create patient', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockPatientRepo.findOne.mockResolvedValue(null);
      mockPatientRepo.create.mockReturnValue({ id: 'p1' });
      mockPatientRepo.save.mockResolvedValue({ id: 'p1' });

      const result = await service.create('f1', {
        fullName: 'John',
        dateOfBirth: '1950-01-01',
        gender: Gender.MALE,
        nic: '123456789V',
      });
      expect(result.id).toBe('p1');
    });

    it('should throw ConflictException on duplicate NIC', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      const error = new QueryFailedError('query', [], new Error(''));
      (error as any).code = '23505';
      mockPatientRepo.save.mockRejectedValue(error);
      await expect(
        service.create('f1', {
          fullName: 'John',
          dateOfBirth: '1950-01-01',
          gender: Gender.MALE,
          nic: '123456789V',
        }),
      ).rejects.toThrow(ConflictException);
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

  describe('findAssignedWithActivePrescriptions', () => {
    it('should return patients with active prescriptions', async () => {
      mockPatientRepo.find.mockResolvedValue([
        { id: 'p1', fullName: 'John Doe', paymentPlan: 'BASIC' },
      ]);
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'rx1',
            patientId: 'p1',
            status: 'active',
            medicines: [{ medicineName: 'Metformin', dosage: '500mg' }],
          },
        ]),
      };
      mockPrescriptionRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAssignedWithActivePrescriptions();
      expect(result.patients.length).toBe(1);
      expect(result.prescriptions.length).toBe(1);
    });

    it('should return empty when no patients have plan', async () => {
      mockPatientRepo.find.mockResolvedValue([]);
      const result = await service.findAssignedWithActivePrescriptions();
      expect(result.patients.length).toBe(0);
      expect(result.prescriptions.length).toBe(0);
    });
  });
});
