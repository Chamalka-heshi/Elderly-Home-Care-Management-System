import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken }  from '@nestjs/typeorm';
import { BookingsService }     from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { FamilyMember }        from '../family/entities/family-member.entity';
import { Patient }             from '../patients/entities/patient.entity';
import { CarePlan }            from '../care-plan/entities/care-plan.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockBookingRepo = {
    create:  jest.fn(),
    save:    jest.fn(),
    find:    jest.fn(),
  };

  const mockFamilyRepo = { findOne: jest.fn() };
  const mockPatientRepo = { findOne: jest.fn() };
  const mockCarePlanRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(FamilyMember), useValue: mockFamilyRepo },
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepo },
        { provide: getRepositoryToken(CarePlan), useValue: mockCarePlanRepo },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    const dto = { carePlanId: 'cp1', patientId: 'p1' } as any;

    it('should create booking successfully', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockCarePlanRepo.findOne.mockResolvedValue({ id: 'cp1', isActive: true, name: 'Plan 1', price: 100 });
      mockPatientRepo.findOne.mockResolvedValue({ id: 'p1' });
      mockBookingRepo.create.mockReturnValue(dto);
      mockBookingRepo.save.mockResolvedValue({ id: 'b1', ...dto });

      const result = await service.createBooking('u1', dto);
      expect(result.id).toEqual('b1');
    });

    it('should throw BadRequestException if care plan is inactive', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockCarePlanRepo.findOne.mockResolvedValue({ id: 'cp1', isActive: false });

      await expect(service.createBooking('u1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyBookings', () => {
    it('should return family bookings', async () => {
      mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
      mockBookingRepo.find.mockResolvedValue([{ id: 'b1' }]);

      const result = await service.getMyBookings('u1');
      expect(result).toHaveLength(1);
    });
  });
});
