/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken }  from '@nestjs/typeorm';
import { AppointmentService }  from './appointment.service';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { ChannelingSlot, SlotStatus }     from '../channeling-slot/entities/channeling-slot.entity';
import { Patient }             from '../patients/entities/patient.entity';
import { FamilyMember }        from '../family/entities/family-member.entity';
import { Doctor }              from '../doctors/entities/doctor.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect:  jest.fn().mockReturnThis(),
    where:              jest.fn().mockReturnThis(),
    andWhere:           jest.fn().mockReturnThis(),
    orderBy:            jest.fn().mockReturnThis(),
    addOrderBy:         jest.fn().mockReturnThis(),
    getMany:            jest.fn(),
  };

  const mockApptRepo = {
    create:             jest.fn(),
    save:               jest.fn(),
    findOne:            jest.fn(),
    find:               jest.fn(),
    count:              jest.fn(),
    remove:             jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockSlotRepo    = { findOne: jest.fn() };
  const mockPatientRepo = { findOne: jest.fn() };
  const mockFamilyRepo  = { findOne: jest.fn() };
  const mockDoctorRepo  = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: getRepositoryToken(Appointment),    useValue: mockApptRepo },
        { provide: getRepositoryToken(ChannelingSlot), useValue: mockSlotRepo },
        { provide: getRepositoryToken(Patient),        useValue: mockPatientRepo },
        { provide: getRepositoryToken(FamilyMember),   useValue: mockFamilyRepo },
        { provide: getRepositoryToken(Doctor),         useValue: mockDoctorRepo },
      ],
    }).compile();
    service = module.get<AppointmentService>(AppointmentService);
    mockApptRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── createAppointment ────────────────────────────────────────────────────
  describe('createAppointment', () => {
    const dto = { slotId: 's1', patientId: 'p1' } as any;

    const activeSlot = {
      id: 's1', status: SlotStatus.ACTIVE,
      date: '2099-12-31', maxPatients: 5,
    };

    it('should create appointment successfully when slot has capacity', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockSlotRepo.findOne.mockResolvedValue(activeSlot);
      mockPatientRepo.findOne.mockResolvedValue({ id: 'p1', isActive: true });
      mockApptRepo.findOne.mockResolvedValue(null);
      mockApptRepo.count.mockResolvedValue(1);
      mockApptRepo.create.mockReturnValue(dto);
      mockApptRepo.save.mockResolvedValue({ id: 'a1', ...dto });

      const result = await service.createAppointment('u1', dto);
      expect(result.id).toBe('a1');
    });

    it('should throw BadRequestException when slot is fully booked', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockSlotRepo.findOne.mockResolvedValue(activeSlot);
      mockPatientRepo.findOne.mockResolvedValue({ id: 'p1', isActive: true });
      mockApptRepo.findOne.mockResolvedValue(null);
      mockApptRepo.count.mockResolvedValue(5);   // maxPatients == count → full

      await expect(service.createAppointment('u1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockSlotRepo.findOne.mockResolvedValue(null);

      await expect(service.createAppointment('u1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive slot', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockSlotRepo.findOne.mockResolvedValue({ ...activeSlot, status: SlotStatus.CANCELLED });

      await expect(service.createAppointment('u1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when patient does not exist', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockSlotRepo.findOne.mockResolvedValue(activeSlot);
      mockPatientRepo.findOne.mockResolvedValue(null);

      await expect(service.createAppointment('u1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for duplicate appointment', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockSlotRepo.findOne.mockResolvedValue(activeSlot);
      mockPatientRepo.findOne.mockResolvedValue({ id: 'p1', isActive: true });
      mockApptRepo.findOne.mockResolvedValue({ id: 'existing' }); // duplicate

      await expect(service.createAppointment('u1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getMyAppointments ────────────────────────────────────────────────────
  describe('getMyAppointments', () => {
    it('should return appointment list for family member', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockApptRepo.find.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

      const result = await service.getMyAppointments('u1');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when family member not found', async () => {
      mockFamilyRepo.findOne.mockResolvedValue(null);
      await expect(service.getMyAppointments('u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── cancelMyAppointment ──────────────────────────────────────────────────
  describe('cancelMyAppointment', () => {
    it('should cancel a PAYMENT_PENDING appointment', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockApptRepo.findOne.mockResolvedValue({ id: 'a1', status: AppointmentStatus.PAYMENT_PENDING });
      mockApptRepo.save.mockImplementation(async (a: any) => a);

      const result = await service.cancelMyAppointment('u1', 'a1');
      expect(result.message).toContain('cancelled');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockApptRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelMyAppointment('u1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-cancellable appointment status', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockApptRepo.findOne.mockResolvedValue({ id: 'a1', status: AppointmentStatus.COMPLETED });

      await expect(service.cancelMyAppointment('u1', 'a1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getDoctorAppointments ────────────────────────────────────────────────
  describe('getDoctorAppointments', () => {
    it('should return mapped appointments for the doctor', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1', user: { id: 'u1' } });
      mockQueryBuilder.getMany.mockResolvedValue([
        { id: 'a1', slot: { date: '2025-01-01', startTime: '09:00', doctor: { user: { fullName: 'Dr.' } } }, patient: { fullName: 'Pat' }, familyMember: { user: { fullName: 'Fam' } }, status: AppointmentStatus.PRESCRIPTION_PENDING },
      ]);

      const result = await service.getDoctorAppointments('u1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when doctor profile not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.getDoctorAppointments('u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateAppointmentStatusByDoctor ─────────────────────────────────────
  describe('updateAppointmentStatusByDoctor', () => {
    const dto = { status: AppointmentStatus.PRESCRIPTION_PENDING };

    it('should update appointment status when doctor owns slot', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockApptRepo.findOne.mockResolvedValue({ id: 'a1', slot: { doctorId: 'd1' }, status: AppointmentStatus.PAYMENT_PENDING });
      mockApptRepo.save.mockImplementation(async (a: any) => a);

      const result = await service.updateAppointmentStatusByDoctor('u1', 'a1', dto);
      expect(result.status).toBe(AppointmentStatus.PRESCRIPTION_PENDING);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockApptRepo.findOne.mockResolvedValue(null);
      await expect(service.updateAppointmentStatusByDoctor('u1', 'missing', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when appointment belongs to another doctor', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'd1' });
      mockApptRepo.findOne.mockResolvedValue({ id: 'a1', slot: { doctorId: 'OTHER_DOCTOR' } });
      await expect(service.updateAppointmentStatusByDoctor('u1', 'a1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getAllAppointments ───────────────────────────────────────────────────
  describe('getAllAppointments', () => {
    it('should return all appointments without filters', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([
        { id: 'a1', slot: { doctor: { user: { fullName: 'Dr.' } } }, patient: { fullName: 'Pat' }, familyMember: { user: { fullName: 'Fam' } }, status: AppointmentStatus.COMPLETED },
      ]);
      const result = await service.getAllAppointments({} as any);
      expect(result).toHaveLength(1);
    });

    it('should apply status filter when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      await service.getAllAppointments({ status: AppointmentStatus.CANCELLED } as any);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('status'), expect.objectContaining({ status: AppointmentStatus.CANCELLED })
      );
    });
  });

  // ─── adminUpdateStatus ────────────────────────────────────────────────────
  describe('adminUpdateStatus', () => {
    it('should update appointment status as admin', async () => {
      const appt = { id: 'a1', status: AppointmentStatus.PAYMENT_PENDING };
      mockApptRepo.findOne.mockResolvedValue(appt);
      mockApptRepo.save.mockImplementation(async (a: any) => a);

      const result = await service.adminUpdateStatus('a1', { status: AppointmentStatus.CANCELLED });
      expect(result.message).toContain('updated');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockApptRepo.findOne.mockResolvedValue(null);
      await expect(service.adminUpdateStatus('missing', { status: AppointmentStatus.CANCELLED })).rejects.toThrow(NotFoundException);
    });

    it('should persist notes when provided', async () => {
      const appt = { id: 'a1', status: AppointmentStatus.PAYMENT_PENDING, notes: '' };
      mockApptRepo.findOne.mockResolvedValue(appt);
      mockApptRepo.save.mockImplementation(async (a: any) => a);

      await service.adminUpdateStatus('a1', { status: AppointmentStatus.COMPLETED, notes: 'OK' });
      expect(mockApptRepo.save).toHaveBeenCalledWith(expect.objectContaining({ notes: 'OK' }));
    });
  });

  // ─── adminDelete ──────────────────────────────────────────────────────────
  describe('adminDelete', () => {
    it('should delete appointment and return success message', async () => {
      const appt = { id: 'a1' };
      mockApptRepo.findOne.mockResolvedValue(appt);
      mockApptRepo.remove.mockResolvedValue(appt);

      const result = await service.adminDelete('a1');
      expect(result.message).toContain('deleted');
      expect(mockApptRepo.remove).toHaveBeenCalledWith(appt);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      mockApptRepo.findOne.mockResolvedValue(null);
      await expect(service.adminDelete('missing')).rejects.toThrow(NotFoundException);
    });
  });
});