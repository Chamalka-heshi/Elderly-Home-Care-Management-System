import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken }  from '@nestjs/typeorm';
import { VitalRecordsService } from './vital-records.service';
import { VitalRecord }         from '../entities/vital-record.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('VitalRecordsService', () => {
  let service: VitalRecordsService;

  const mockRepo = {
    create:  jest.fn(),
    save:    jest.fn(),
    findOne: jest.fn(),
    find:    jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VitalRecordsService,
        { provide: getRepositoryToken(VitalRecord), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<VitalRecordsService>(VitalRecordsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save vital record', async () => {
      const dto = { patientId: 'p1', heartRate: 80 } as any;
      mockRepo.create.mockReturnValue({ ...dto, caregiverId: 'c1' });
      mockRepo.save.mockResolvedValue({ id: 'v1', ...dto, caregiverId: 'c1' });

      const result = await service.create(dto, 'c1');
      expect(result.id).toEqual('v1');
    });
  });

  describe('update', () => {
    it('should update if authorized', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'v1', caregiverId: 'c1', heartRate: 80 });
      mockRepo.save.mockImplementation(async (record) => record);

      const result = await service.update('v1', { heartRate: 85 } as any, 'c1');
      expect(result.heartRate).toEqual(85);
    });

    it('should throw ForbiddenException if caregiverId does not match', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'v1', caregiverId: 'c1' });
      await expect(service.update('v1', {} as any, 'c2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByPatient', () => {
    it('should return records for patient', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'v1' }]);
      const result = await service.findByPatient('p1');
      expect(result).toHaveLength(1);
    });
  });
});
