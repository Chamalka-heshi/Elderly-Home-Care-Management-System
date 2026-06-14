import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Patient } from '../patients/entities/patient.entity';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBookingRepo = {
    findOne: jest.fn(),
  };

  const mockAppointmentRepo = {
    findOne: jest.fn(),
  };

  const mockFamilyRepo = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepo,
        },
        { provide: getRepositoryToken(FamilyMember), useValue: mockFamilyRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    mockPaymentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should throw BadRequestException if both bookingId and appointmentId are provided', async () => {
      await expect(
        service.createPayment('u1', {
          bookingId: 'b1',
          appointmentId: 'a1',
          paymentMethod: PaymentMethod.CARD,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if family member not found', async () => {
      mockFamilyRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createPayment('u1', {
          bookingId: 'b1',
          paymentMethod: PaymentMethod.CARD,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    describe('with bookingId', () => {
      it('should throw NotFoundException if booking not found', async () => {
        mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
        mockBookingRepo.findOne.mockResolvedValue(null);
        await expect(
          service.createPayment('u1', {
            bookingId: 'b1',
            paymentMethod: PaymentMethod.CARD,
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if booking is cancelled', async () => {
        mockFamilyRepo.findOne.mockResolvedValue({ id: 'f1' });
        mockBookingRepo.findOne.mockResolvedValue({
          userId: 'f1',
          status: BookingStatus.CANCELLED,
        });
        await expect(
          service.createPayment('u1', {
            bookingId: 'b1',
            paymentMethod: PaymentMethod.CARD,
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('approvePayment', () => {
    it('should approve bank transfer and update booking/appointment', async () => {
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === Payment)
              return {
                findOne: jest.fn().mockResolvedValue({
                  id: 'p1',
                  paymentMethod: PaymentMethod.BANK_TRANSFER,
                  status: PaymentStatus.PENDING_APPROVAL,
                }),
                save: jest.fn().mockResolvedValue({
                  id: 'p1',
                  status: PaymentStatus.PAID,
                } as any),
              };
            if (entity === Booking)
              return {
                findOne: jest.fn().mockResolvedValue({
                  status: BookingStatus.PENDING_PAYMENT,
                  carePlanSnapshot: { name: 'Basic' },
                }),
                save: jest.fn(),
              };
            if (entity === Patient)
              return {
                update: jest.fn(),
              };
          }),
        };
        return cb(manager);
      });

      const result = await service.approvePayment('p1');
      expect(result.message).toContain('approved');
      expect(result.payment.status).toEqual(PaymentStatus.PAID);
    });
  });
});
