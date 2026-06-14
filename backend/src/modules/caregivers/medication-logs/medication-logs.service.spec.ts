import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicationLogsService } from './medication-logs.service';
import { MedicationLog } from '../entities/medication-log.entity';
import { ForbiddenException } from '@nestjs/common';

describe('MedicationLogsService', () => {
  let service: MedicationLogsService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationLogsService,
        { provide: getRepositoryToken(MedicationLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MedicationLogsService>(MedicationLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save log', async () => {
      const dto = { patientId: 'p1', medicationName: 'Panadol' } as any;
      mockRepo.create.mockReturnValue({ ...dto, caregiverId: 'c1' });
      mockRepo.save.mockResolvedValue({ id: 'l1', ...dto, caregiverId: 'c1' });

      const result = await service.create(dto, 'c1');
      expect(result.id).toEqual('l1');
      expect(result.caregiverId).toEqual('c1');
    });
  });

  describe('update', () => {
    it('should update if authorized', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'l1',
        caregiverId: 'c1',
        medicationName: 'Old',
      });
      mockRepo.save.mockImplementation(async (log) => log);

      const result = await service.update(
        'l1',
        { medicationName: 'New' } as any,
        'c1',
      );
      expect(result.medicationName).toEqual('New');
    });

    it('should throw ForbiddenException if caregiverId does not match', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'l1', caregiverId: 'c1' });
      await expect(service.update('l1', {} as any, 'c2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByPatient', () => {
    it('should return logs for patient', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'l1' }]);
      const result = await service.findByPatient('p1');
      expect(result).toHaveLength(1);
    });
  });
});
