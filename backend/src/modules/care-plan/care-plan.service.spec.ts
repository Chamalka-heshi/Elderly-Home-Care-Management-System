import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CarePlanService } from './care-plan.service';
import { CarePlan } from './entities/care-plan.entity';
import { NotFoundException } from '@nestjs/common';

describe('CarePlanService', () => {
  let service: CarePlanService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarePlanService,
        { provide: getRepositoryToken(CarePlan), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CarePlanService>(CarePlanService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPlan', () => {
    it('should create and save care plan', async () => {
      const dto = { name: 'Premium', price: 100 } as any;
      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue({ id: 'cp1', ...dto });

      const result = await service.createPlan(dto);
      expect(result.id).toEqual('cp1');
    });
  });

  describe('updatePlan', () => {
    it('should update care plan', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'cp1', name: 'Old' });
      mockRepo.save.mockImplementation(async (cp) => cp);

      const result = await service.updatePlan('cp1', { name: 'New' } as any);
      expect(result.name).toEqual('New');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.updatePlan('cp1', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivatePlan', () => {
    it('should deactivate active plan', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'cp1', isActive: true });
      mockRepo.save.mockImplementation(async (cp) => cp);

      const result = await service.deactivatePlan('cp1');
      expect(result.message).toContain('deactivated successfully');
    });
  });
});
