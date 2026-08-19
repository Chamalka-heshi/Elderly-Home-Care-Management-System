import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;

  const mockTransporter = {
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, any> = {
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: 587,
        SMTP_SECURE: 'false',
        SMTP_USER: 'test@test.com',
        SMTP_PASS: 'password',
        SYSTEM_NAME: 'Test System',
        APP_URL: 'http://localhost:3000',
        MAIL_FROM: 'no-reply@test.com',
      };
      return config[key] ?? null;
    }),
  };

  beforeEach(async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── onModuleInit ─────────────────────────────────────────────────────────
  describe('onModuleInit', () => {
    it('should verify the transporter on module init', async () => {
      await service.onModuleInit();
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should not throw when transporter verification fails', async () => {
      mockTransporter.verify.mockRejectedValueOnce(
        new Error('Connection failed'),
      );
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  // ─── sendMail ─────────────────────────────────────────────────────────────
  describe('sendMail', () => {
    it('should delegate to transporter.sendMail', async () => {
      const opts = {
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };
      await service.sendMail(opts);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(opts);
    });
  });

  // ─── sendAccountCredentials ───────────────────────────────────────────────
  describe('sendAccountCredentials', () => {
    it('should send credentials email with recipient address and role', async () => {
      await service.sendAccountCredentials(
        'user@test.com',
        'John Doe',
        'Doctor',
        'tempPw123',
      );
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.to).toContain('user@test.com');
      expect(mail.subject).toContain('Doctor');
      expect(mail.html).toContain('tempPw123');
    });

    it('should include the recipient full name in the email body', async () => {
      await service.sendAccountCredentials(
        'user@test.com',
        'Jane Smith',
        'Admin',
        'pw456',
      );
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('Jane Smith');
    });
  });

  // ─── sendPasswordResetEmail ───────────────────────────────────────────────
  describe('sendPasswordResetEmail', () => {
    it('should send reset email with temporary password', async () => {
      await service.sendPasswordResetEmail(
        'user@test.com',
        'John',
        'resetPw123',
      );
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.to).toContain('user@test.com');
      expect(mail.subject).toContain('Temporary Password');
      expect(mail.html).toContain('resetPw123');
    });

    it('should include the user name in the email body', async () => {
      await service.sendPasswordResetEmail('user@test.com', 'Alice', 'pw789');
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('Alice');
    });
  });

  // ─── sendReplyEmail ───────────────────────────────────────────────────────
  describe('sendReplyEmail', () => {
    it('should send reply email with correct structure', async () => {
      await service.sendReplyEmail(
        'John Doe',
        'user@test.com',
        'Here is my reply',
        'Original message',
        '+123456789',
        'admin@test.com',
      );
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.to).toContain('user@test.com');
      expect(mail.subject).toContain('Re: Your Enquiry');
      expect(mail.html).toContain('Here is my reply');
    });

    it('should include original message content in reply', async () => {
      await service.sendReplyEmail(
        'Jane',
        'j@test.com',
        'Reply text',
        'Original content',
        '123',
        'admin@test.com',
      );
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('Original content');
    });
  });

  // ─── sendPrescriptionNotification ────────────────────────────────────────
  describe('sendPrescriptionNotification', () => {
    // Base opts using the new action-aware shape (action: 'NEW')
    const baseOpts = {
      to: 'family@test.com',
      familyMemberName: 'Jane Doe',
      patientName: 'John Patient',
      doctorName: 'Dr. Smith',
      action: 'NEW' as const,
      newPrescription: {
        issuedDate: '2024-01-01',
        medicines: [
          {
            medicineName: 'Panadol',
            dosage: '2',
            frequency: 'bd',
            durationDays: 3,
          },
        ],
      },
    };

    it('should send prescription notification with medicine details', async () => {
      await service.sendPrescriptionNotification(baseOpts);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.to).toContain('family@test.com');
      expect(mail.subject).toContain('John Patient');
      expect(mail.html).toContain('Panadol');
    });

    it('should include doctor name in notification body', async () => {
      await service.sendPrescriptionNotification(baseOpts);
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('Dr. Smith');
    });

    it('should include patient name in notification body', async () => {
      await service.sendPrescriptionNotification(baseOpts);
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('John Patient');
    });

    it('should handle multiple medicines in the notification', async () => {
      const multiMedOpts = {
        ...baseOpts,
        newPrescription: {
          issuedDate: '2024-01-01',
          medicines: [
            {
              medicineName: 'Panadol',
              dosage: '2',
              frequency: 'bd',
              durationDays: 3,
            },
            {
              medicineName: 'Amoxicillin',
              dosage: '1',
              frequency: 'tds',
              durationDays: 7,
            },
          ],
        },
      };
      await service.sendPrescriptionNotification(multiMedOpts);
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('Amoxicillin');
    });

    it('should render CONTINUED action email with continued prescription label', async () => {
      const continuedOpts = {
        to: 'family@test.com',
        familyMemberName: 'Jane Doe',
        patientName: 'John Patient',
        doctorName: 'Dr. Smith',
        action: 'CONTINUED' as const,
        continuedPrescription: {
          issuedDate: '2024-01-01',
          medicines: [{ medicineName: 'Aspirin', dosage: '100mg', frequency: 'Once daily', durationDays: 30 }],
          status: 'active',
        },
      };
      await service.sendPrescriptionNotification(continuedOpts);
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('CONTINUED');
      expect(mail.html).toContain('Aspirin');
    });

    it('should render CANCELLED_AND_REPLACED email with both cancelled and new labels', async () => {
      const replacedOpts = {
        to: 'family@test.com',
        familyMemberName: 'Jane Doe',
        patientName: 'John Patient',
        doctorName: 'Dr. Smith',
        action: 'CANCELLED_AND_REPLACED' as const,
        cancelledPrescription: {
          issuedDate: '2024-01-01',
          medicines: [{ medicineName: 'OldDrug', dosage: '5mg', frequency: 'Once daily', durationDays: 14 }],
          status: 'discontinued',
        },
        newPrescription: {
          issuedDate: '2024-02-01',
          medicines: [{ medicineName: 'NewDrug', dosage: '10mg', frequency: 'Twice daily', durationDays: 7 }],
          status: 'active',
        },
      };
      await service.sendPrescriptionNotification(replacedOpts);
      const mail = mockTransporter.sendMail.mock.calls[0][0];
      expect(mail.html).toContain('CANCELLED');
      expect(mail.html).toContain('OldDrug');
      expect(mail.html).toContain('NewDrug');
    });
  });
});
