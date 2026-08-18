import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrescriptionService } from './prescription.service';
import { Prescription } from './entities/prescription.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Booking } from '../bookings/entities/booking.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { MailService } from '../mail/mail.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('PrescriptionService', () => {
  let service: PrescriptionService;

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn(),
  };

  const mockPrescriptionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDoctorRepo = { findOne: jest.fn() };
  const mockFamilyMemberRepo = { findOne: jest.fn() };
  const mockPatientRepo = { findOne: jest.fn() };
  const mockBookingRepo = { find: jest.fn(), findOne: jest.fn() };
  const mockAppointmentRepo = { findOne: jest.fn(), update: jest.fn() };
  const mockMailService = { sendPrescriptionNotification: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    Object.assign(mockQueryBuilder, {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn(),
    });

    Object.assign(mockPrescriptionRepo, {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    });

    Object.assign(mockDoctorRepo, { findOne: jest.fn() });
    Object.assign(mockFamilyMemberRepo, { findOne: jest.fn() });
    Object.assign(mockPatientRepo, { findOne: jest.fn() });
    Object.assign(mockBookingRepo, { find: jest.fn(), findOne: jest.fn() });
    Object.assign(mockAppointmentRepo, {
      findOne: jest.fn(),
      update: jest.fn(),
    });
    Object.assign(mockMailService, { sendPrescriptionNotification: jest.fn() });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionService,
        {
          provide: getRepositoryToken(Prescription),
          useValue: mockPrescriptionRepo,
        },
        { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepo },
        {
          provide: getRepositoryToken(FamilyMember),
          useValue: mockFamilyMemberRepo,
        },
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepo,
        },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();
    service = module.get<PrescriptionService>(PrescriptionService);
    mockPrescriptionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      patientId: 'p1',
      patientName: 'John',
      patientAge: 30,
      issuedDate: '2024-01-01',
      medicines: [],
    } as any;

    it('should create prescription and return saved record', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'd1',
        user: { fullName: 'Dr. Smith' },
      });
      mockPrescriptionRepo.create.mockReturnValue(dto);
      mockPrescriptionRepo.save.mockResolvedValue({ id: 'rx1', ...dto });
      mockPatientRepo.findOne.mockResolvedValue({
        familyMember: { user: { email: 'fam@test.com' } },
      });
      mockPrescriptionRepo.find.mockResolvedValue([]);

      const result = await service.create('u1', dto);
      expect(result.id).toBe('rx1');
      expect(mockPrescriptionRepo.save).toHaveBeenCalled();
    });

    it('should link and complete appointment when appointmentId provided', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockAppointmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        slot: { doctorId: 'd1' },
      });
      mockPrescriptionRepo.create.mockReturnValue(dto);
      mockPrescriptionRepo.save.mockResolvedValue({ id: 'rx1' });

      await service.create('u1', { ...dto, appointmentId: 'a1' });

      expect(mockAppointmentRepo.update).toHaveBeenCalledWith('a1', {
        status: AppointmentStatus.COMPLETED,
        prescriptionId: 'rx1',
      });
    });

    it('should omit medicines already active for the patient when creating a follow-up prescription', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.find.mockResolvedValue([
        {
          status: 'active',
          medicines: [{ medicineName: 'Metformin', dosage: '500mg' }],
        },
      ]);
      mockPrescriptionRepo.create.mockImplementation((entity) => entity);
      mockPrescriptionRepo.save.mockResolvedValue({ id: 'rx2' });
      mockPatientRepo.findOne.mockResolvedValue({
        familyMember: { user: { email: 'fam@test.com' } },
      });
      mockPrescriptionRepo.find.mockResolvedValueOnce([
        {
          status: 'active',
          medicines: [{ medicineName: 'Metformin', dosage: '500mg' }],
        },
      ]);
      mockPrescriptionRepo.find.mockResolvedValueOnce([]);

      await service.create('u1', {
        ...dto,
        patientId: 'p1',
        medicines: [
          { medicineName: 'Metformin', dosage: '500mg', frequency: 'Once daily', durationDays: 7 },
          { medicineName: 'Vitamin D', dosage: '1000IU', frequency: 'Once daily', durationDays: 30 },
        ],
      });

      expect(mockPrescriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          medicines: [{ medicineName: 'Vitamin D', dosage: '1000IU', frequency: 'Once daily', durationDays: 30 }],
        }),
      );
    });

    it('should throw ForbiddenException when doctor profile not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.create('u1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── autoExpireActive ─────────────────────────────────────────────────────
  describe('autoExpireActive', () => {
    it('should return the number of affected prescriptions', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 3 });
      const count = await service.autoExpireActive();
      expect(count).toBe(3);
    });

    it('should return 0 when no prescriptions are affected', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });
      const count = await service.autoExpireActive();
      expect(count).toBe(0);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated prescriptions for the doctor', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 'rx1' }], 1]);

      const result = await service.findAll('u1');
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should apply status filter when provided', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll('u1', 'active' as any);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.objectContaining({ status: 'active' }),
      );
    });
  });

  // ─── findForPatient ───────────────────────────────────────────────────────
  describe('findForPatient', () => {
    it('should return prescriptions for a patient when doctor is authorized', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.find.mockResolvedValue([{ id: 'rx1' }]);

      const result = await service.findForPatient('p1', 'u1');
      expect(result).toHaveLength(1);
    });

    it('should throw when doctor is not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.findForPatient('p1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── findForFamily ────────────────────────────────────────────────────────
  describe('findForFamily', () => {
    it('should return prescriptions for all patients in the family', async () => {
      mockFamilyMemberRepo.findOne.mockResolvedValue({
        patients: [{ id: 'p1' }],
      });
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'rx1' }]);

      const result = await service.findForFamily('u1');
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should return empty result when family has no patients', async () => {
      mockFamilyMemberRepo.findOne.mockResolvedValue({ patients: [] });
      const result = await service.findForFamily('u1');
      expect(result.data).toHaveLength(0);
    });

    it('should throw ForbiddenException when no family member profile', async () => {
      mockFamilyMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.findForFamily('u1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when userId is empty', async () => {
      await expect(service.findForFamily('')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return the prescription when owned by doctor', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.findOne.mockResolvedValue({ id: 'rx1' });

      const result = await service.findOne('rx1', 'u1');
      expect(result.id).toBe('rx1');
    });

    it('should throw NotFoundException when prescription not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findOneForFamily ─────────────────────────────────────────────────────
  describe('findOneForFamily', () => {
    it('should return prescription when it belongs to a family patient', async () => {
      mockFamilyMemberRepo.findOne.mockResolvedValue({
        patients: [{ id: 'p1' }],
      });
      mockQueryBuilder.getOne.mockResolvedValue({ id: 'rx1' });

      const result = await service.findOneForFamily('rx1', 'u1');
      expect(result.id).toBe('rx1');
    });

    it('should throw NotFoundException when prescription not in family patients', async () => {
      mockFamilyMemberRepo.findOne.mockResolvedValue({
        patients: [{ id: 'p1' }],
      });
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOneForFamily('missing', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when no family profile', async () => {
      mockFamilyMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneForFamily('rx1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── discontinue ─────────────────────────────────────────────────────────
  describe('discontinue', () => {
    it('should discontinue an active prescription', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.findOne.mockResolvedValue({
        id: 'rx1',
        status: 'active',
      });
      mockPrescriptionRepo.save.mockImplementation(async (rx) => rx);

      const result = await service.discontinue('rx1', 'u1');
      expect(result.status).toBe('discontinued');
    });

    it('should throw BadRequestException if already discontinued', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.findOne.mockResolvedValue({
        id: 'rx1',
        status: 'discontinued',
      });

      await expect(service.discontinue('rx1', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── complete ─────────────────────────────────────────────────────────────
  describe('complete', () => {
    it('should complete an active prescription', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.findOne.mockResolvedValue({
        id: 'rx1',
        status: 'active',
      });
      mockPrescriptionRepo.save.mockImplementation(async (rx) => rx);

      const result = await service.complete('rx1', 'u1');
      expect(result.status).toBe('completed');
    });

    it('should throw BadRequestException if already completed', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockPrescriptionRepo.findOne.mockResolvedValue({
        id: 'rx1',
        status: 'completed',
      });

      await expect(service.complete('rx1', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});