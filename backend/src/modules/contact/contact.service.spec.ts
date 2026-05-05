/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken }  from '@nestjs/typeorm';
import { ContactService }      from './contact.service';
import { ContactMessage }      from './entities/contact-message.entity';
import { ContactInfo }         from './entities/contact-info.entity';
import { MailService }         from '../mail/mail.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ContactService', () => {
  let service: ContactService;

  const mockMessageRepo = {
    create:  jest.fn(),
    save:    jest.fn(),
    find:    jest.fn(),
    findOne: jest.fn(),
    remove:  jest.fn(),
  };

  const mockInfoRepo = {
    create:  jest.fn(),
    save:    jest.fn(),
    findOne: jest.fn(),
  };

  const mockMailService = { sendReplyEmail: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: getRepositoryToken(ContactMessage), useValue: mockMessageRepo },
        { provide: getRepositoryToken(ContactInfo),    useValue: mockInfoRepo },
        { provide: MailService,                        useValue: mockMailService },
      ],
    }).compile();
    service = module.get<ContactService>(ContactService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── getInfo ──────────────────────────────────────────────────────────────
  describe('getInfo', () => {
    it('should return contact info when it exists', async () => {
      const info = { id: '1', phonePrimary: '123', email: 'contact@test.com' };
      mockInfoRepo.findOne.mockResolvedValue(info);

      const result = await service.getInfo();
      expect(result).toEqual(info);
    });

    it('should throw NotFoundException when info does not exist', async () => {
      mockInfoRepo.findOne.mockResolvedValue(null);
      await expect(service.getInfo()).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateInfo ───────────────────────────────────────────────────────────
  describe('updateInfo', () => {
    it('should create new contact info when none exists', async () => {
      const dto = { phonePrimary: '456', email: 'new@test.com' };
      mockInfoRepo.findOne.mockResolvedValue(null);
      mockInfoRepo.create.mockReturnValue({ ...dto });
      mockInfoRepo.save.mockResolvedValue({ id: '1', ...dto });

      const result = await service.updateInfo(dto);
      expect(result.message).toContain('successfully');
      expect(result.data.phonePrimary).toBe('456');
      expect(mockInfoRepo.create).toHaveBeenCalled();
    });

    it('should update existing contact info when record exists', async () => {
      const existing = { id: '1', phonePrimary: '123' };
      const dto      = { phonePrimary: '456' };
      mockInfoRepo.findOne.mockResolvedValue(existing);
      mockInfoRepo.save.mockImplementation(async (v) => v);

      const result = await service.updateInfo(dto);
      expect(result.data.phonePrimary).toBe('456');
      expect(mockInfoRepo.save).toHaveBeenCalled();
    });

    it('should merge partial updates into existing record', async () => {
      const existing = { id: '1', phonePrimary: '123', phoneSecondary: '999', email: 'old@test.com' };
      mockInfoRepo.findOne.mockResolvedValue(existing);
      mockInfoRepo.save.mockImplementation(async (v) => v);

      const result = await service.updateInfo({ email: 'new@test.com' });
      expect(result.data.email).toBe('new@test.com');
      expect(result.data.phonePrimary).toBe('123'); // unchanged
    });
  });

  // ─── createMessage ────────────────────────────────────────────────────────
  describe('createMessage', () => {
    it('should save a new contact message and return success response', async () => {
      const dto = { fullName: 'John', email: 'j@test.com', message: 'Hello', phone: '123' };
      mockMessageRepo.create.mockReturnValue(dto);
      mockMessageRepo.save.mockResolvedValue({ id: 'msg1', ...dto, status: 'pending' });

      const result = await service.createMessage(dto);
      expect(result.message).toContain('received');
      expect(mockMessageRepo.save).toHaveBeenCalled();
    });

    it('should save message with pending status', async () => {
      const dto = { fullName: 'Jane', email: 'j@test.com', message: 'Hi', phone: '456' };
      mockMessageRepo.create.mockReturnValue(dto);
      mockMessageRepo.save.mockResolvedValue({ id: 'msg2', ...dto, status: 'pending' });

      await service.createMessage(dto);
      expect(mockMessageRepo.save).toHaveBeenCalledWith(expect.objectContaining(dto));
    });
  });

  // ─── getAllMessages ────────────────────────────────────────────────────────
  describe('getAllMessages', () => {
    it('should return messages with total and pending counts', async () => {
      const msgs = [{ id: '1', status: 'pending' }, { id: '2', status: 'replied' }, { id: '3', status: 'pending' }];
      mockMessageRepo.find.mockResolvedValue(msgs);

      const result = await service.getAllMessages();
      expect(result.total).toBe(3);
      expect(result.pending).toBe(2);
      expect(result.messages).toEqual(msgs);
    });

    it('should return empty result when no messages exist', async () => {
      mockMessageRepo.find.mockResolvedValue([]);

      const result = await service.getAllMessages();
      expect(result.total).toBe(0);
      expect(result.pending).toBe(0);
    });
  });

  // ─── getMessage ───────────────────────────────────────────────────────────
  describe('getMessage', () => {
    it('should return message by id', async () => {
      const msg = { id: '1', message: 'Hello' };
      mockMessageRepo.findOne.mockResolvedValue(msg);

      const result = await service.getMessage('1');
      expect(result).toEqual(msg);
    });

    it('should throw NotFoundException when message not found', async () => {
      mockMessageRepo.findOne.mockResolvedValue(null);
      await expect(service.getMessage('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── replyToMessage ───────────────────────────────────────────────────────
  describe('replyToMessage', () => {
    it('should reply and send email to the sender', async () => {
      const msg  = { id: '1', status: 'pending', fullName: 'John', email: 'j@test.com', message: 'Help', phone: '123' };
      const info = { phonePrimary: '456', email: 'admin@test.com' };
      mockMessageRepo.findOne.mockResolvedValue(msg);
      mockMessageRepo.save.mockImplementation(async (m) => m);
      mockInfoRepo.findOne.mockResolvedValue(info);

      const result = await service.replyToMessage('1', { reply: 'Hi John' }, 'admin1');
      // sendReplyEmail is fire-and-forget (.catch); flush the microtask queue before asserting
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(result.data.status).toBe('replied');
      expect(result.data.reply).toBe('Hi John');
      expect(mockMailService.sendReplyEmail).toHaveBeenCalled();
    });

    it('should persist the reply text and repliedBy', async () => {
      const msg = { id: '1', status: 'pending', fullName: 'Alice', email: 'a@test.com', message: 'Q?' };
      mockMessageRepo.findOne.mockResolvedValue(msg);
      mockMessageRepo.save.mockImplementation(async (m) => m);
      mockInfoRepo.findOne.mockResolvedValue({ phonePrimary: '1', email: 'a@test.com' });

      const result = await service.replyToMessage('1', { reply: 'Answer' }, 'adminUser');
      expect(result.data.repliedByAdminId).toBe('adminUser');
      expect(result.data.reply).toBe('Answer');
    });

    it('should throw BadRequestException when message already replied', async () => {
      mockMessageRepo.findOne.mockResolvedValue({ id: '1', status: 'replied' });
      await expect(service.replyToMessage('1', { reply: 'Hi' }, 'admin1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when message does not exist', async () => {
      mockMessageRepo.findOne.mockResolvedValue(null);
      await expect(service.replyToMessage('missing', { reply: 'Hi' }, 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteMessage ────────────────────────────────────────────────────────
  describe('deleteMessage', () => {
    it('should remove the message and return success', async () => {
      const msg = { id: '1', message: 'text' };
      mockMessageRepo.findOne.mockResolvedValue(msg);
      mockMessageRepo.remove.mockResolvedValue(msg);

      const result = await service.deleteMessage('1');
      expect(result.message).toContain('deleted');
      expect(mockMessageRepo.remove).toHaveBeenCalledWith(msg);
    });

    it('should throw NotFoundException when message does not exist', async () => {
      mockMessageRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteMessage('missing')).rejects.toThrow(NotFoundException);
    });
  });
});