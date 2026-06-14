/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelingSlotService } from './channeling-slot.service';
import { ChannelingSlot, SlotStatus } from './entities/channeling-slot.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

describe('ChannelingSlotService', () => {
  let service: ChannelingSlotService;

  const mockSlotRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDoctorRepo = {
    findOne: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelingSlotService,
        { provide: getRepositoryToken(ChannelingSlot), useValue: mockSlotRepo },
        { provide: getRepositoryToken(Doctor), useValue: mockDoctorRepo },
      ],
    }).compile();

    service = module.get<ChannelingSlotService>(ChannelingSlotService);
    mockSlotRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      doctorId: 'doc1',
      date: '2099-01-01',
      startTime: '09:00',
      endTime: '10:00',
      maxPatients: 5,
      bookingCutoffMinutes: 30,
    } as any;

    it('should create slot successfully', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'doc1',
        consultationFee: 1000,
        user: { isActive: true },
      });
      mockSlotRepo.find.mockResolvedValue([]);
      mockSlotRepo.create.mockReturnValue(dto);
      mockSlotRepo.save.mockResolvedValue({ id: 'slot1', ...dto });

      const result = await service.create(dto);
      expect(result.id).toEqual('slot1');
      expect(mockSlotRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if time overlaps', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({
        id: 'doc1',
        user: { isActive: true },
      });
      mockSlotRepo.find.mockResolvedValueOnce([]); // slotsThisWeek
      mockSlotRepo.find.mockResolvedValueOnce([
        { startTime: '09:30', endTime: '10:30' },
      ]); // existing today

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptSlot', () => {
    it('should update status to ACTIVE', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.findOne.mockResolvedValue({
        id: 'slot1',
        status: SlotStatus.PENDING,
      });
      mockSlotRepo.save.mockImplementation(async (s: ChannelingSlot) => s);

      const result = await service.acceptSlot('slot1', 'user1');
      expect(result.status).toEqual(SlotStatus.ACTIVE);
    });

    it('should throw BadRequestException if not pending', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.findOne.mockResolvedValue({
        id: 'slot1',
        status: SlotStatus.ACTIVE,
      });

      await expect(service.acceptSlot('slot1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return slots and total', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 's1' }], 1]);
      mockSlotRepo.query.mockResolvedValue(null); // autoCompletePassedSlots

      const result = await service.findAll();
      expect(result.total).toBe(1);
      expect(result.slots[0].id).toBe('s1');
    });
  });

  describe('rejectSlot', () => {
    it('should update status to REJECTED', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.findOne.mockResolvedValue({
        id: 'slot1',
        doctorId: 'doc1',
        status: SlotStatus.PENDING,
      });
      mockSlotRepo.save.mockImplementation(async (s: ChannelingSlot) => s);

      const result = await service.rejectSlot('slot1', 'user1');
      expect(result.status).toEqual(SlotStatus.REJECTED);
    });

    it('should throw BadRequestException if slot is not pending', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.findOne.mockResolvedValue({
        id: 'slot1',
        doctorId: 'doc1',
        status: SlotStatus.ACTIVE,
      });

      await expect(service.rejectSlot('slot1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.rejectSlot('slot1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if slot not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.findOne.mockResolvedValue(null);
      await expect(service.rejectSlot('slot1', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateDoctorSlotFee', () => {
    it('should update consultationFee for the slot', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.findOne.mockResolvedValue({
        id: 'slot1',
        doctorId: 'doc1',
        consultationFee: 1000,
      });
      mockSlotRepo.save.mockImplementation(async (s: ChannelingSlot) => s);

      const result = await service.updateDoctorSlotFee('slot1', 'user1', {
        consultationFee: 2000,
      });
      expect(result.consultationFee).toBe(2000);
    });

    it('should throw NotFoundException if doctor not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateDoctorSlotFee('slot1', 'user1', { consultationFee: 500 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if slot not found for doctor', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateDoctorSlotFee('slot1', 'user1', { consultationFee: 500 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a slot when found', async () => {
      mockSlotRepo.findOne.mockResolvedValue({
        id: 'slot1',
        status: SlotStatus.ACTIVE,
      });
      const result = await service.findOne('slot1');
      expect(result.id).toBe('slot1');
    });

    it('should throw NotFoundException when slot not found', async () => {
      mockSlotRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update allowed fields and save', async () => {
      const existing = {
        id: 'slot1',
        status: SlotStatus.PENDING,
        date: '2099-01-01',
        startTime: '09:00',
        endTime: '10:00',
        maxPatients: 5,
        bookingCutoffMinutes: 30,
        notes: null,
        careHomeFee: null,
      };
      mockSlotRepo.findOne.mockResolvedValue(existing);
      mockSlotRepo.save.mockImplementation(async (s: ChannelingSlot) => s);

      const result = await service.update('slot1', {
        maxPatients: 10,
        notes: 'Updated',
      });
      expect(result.maxPatients).toBe(10);
      expect(result.notes).toBe('Updated');
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      mockSlotRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing', { maxPatients: 3 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should set slot status to CANCELLED', async () => {
      const slot = { id: 'slot1', status: SlotStatus.ACTIVE };
      mockSlotRepo.findOne.mockResolvedValue(slot);
      mockSlotRepo.save.mockImplementation(async (s: ChannelingSlot) => s);

      const result = await service.cancel('slot1');
      expect(result.message).toContain('cancelled');
      expect(slot.status).toBe(SlotStatus.CANCELLED);
    });

    it('should throw BadRequestException if slot is already cancelled', async () => {
      mockSlotRepo.findOne.mockResolvedValue({
        id: 'slot1',
        status: SlotStatus.CANCELLED,
      });
      await expect(service.cancel('slot1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if slot not found', async () => {
      mockSlotRepo.findOne.mockResolvedValue(null);
      await expect(service.cancel('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove the slot and return success message', async () => {
      const slot = { id: 'slot1', status: SlotStatus.PENDING };
      mockSlotRepo.findOne.mockResolvedValue(slot);
      mockSlotRepo.remove.mockResolvedValue(slot);

      const result = await service.remove('slot1');
      expect(result.message).toContain('deleted');
      expect(mockSlotRepo.remove).toHaveBeenCalledWith(slot);
    });

    it('should throw NotFoundException if slot not found', async () => {
      mockSlotRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findSlotsByUserId', () => {
    it('should return slots for a doctor user', async () => {
      mockDoctorRepo.findOne.mockResolvedValue({ id: 'doc1' });
      mockSlotRepo.query.mockResolvedValue(null); // autoCompletePassedSlots
      mockSlotRepo.find.mockResolvedValue([{ id: 's1' }, { id: 's2' }]);

      const result = await service.findSlotsByUserId('user1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('s1');
    });

    it('should throw NotFoundException if doctor profile not found', async () => {
      mockDoctorRepo.findOne.mockResolvedValue(null);
      await expect(service.findSlotsByUserId('user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAvailableSlotsWithDoctors', () => {
    it('should return active upcoming slots', async () => {
      mockSlotRepo.query.mockResolvedValue(null); // autoCompletePassedSlots
      mockSlotRepo.find.mockResolvedValue([
        { id: 's1', status: SlotStatus.ACTIVE, date: '2099-12-01' },
        { id: 's2', status: SlotStatus.ACTIVE, date: '2099-12-02' },
      ]);

      const result = await service.getAvailableSlotsWithDoctors();
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.status === SlotStatus.ACTIVE)).toBe(true);
    });

    it('should return empty array when no active slots exist', async () => {
      mockSlotRepo.query.mockResolvedValue(null);
      mockSlotRepo.find.mockResolvedValue([]);

      const result = await service.getAvailableSlotsWithDoctors();
      expect(result).toHaveLength(0);
    });
  });
});
