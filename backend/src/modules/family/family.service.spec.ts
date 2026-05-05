import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken }  from '@nestjs/typeorm';
import { FamilyService }       from './family.service';
import { FamilyMember }        from './entities/family-member.entity';
import { UsersService }        from '../users/users.service';
import { NotFoundException }   from '@nestjs/common';
import { User }                from '../users/entities/user.entity';

describe('FamilyService', () => {
  let service: FamilyService;

  const mockFamilyRepo = {
    create:  jest.fn(),
    save:    jest.fn(),
    findOne: jest.fn(),
    find:    jest.fn(),
  };

  const mockUsersService = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyService,
        { provide: getRepositoryToken(FamilyMember), useValue: mockFamilyRepo },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<FamilyService>(FamilyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a family member', async () => {
      const user = { id: 'user1' } as User;
      mockFamilyRepo.create.mockReturnValue({ user });
      mockFamilyRepo.save.mockResolvedValue({ id: 'fam1', user });

      const result = await service.create({ user });
      expect(result).toEqual({ id: 'fam1', user });
      expect(mockFamilyRepo.create).toHaveBeenCalledWith({ user });
      expect(mockFamilyRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByUserId', () => {
    it('should find a family member by user id', async () => {
      const member = { id: 'fam1', user: { id: 'user1' } };
      mockFamilyRepo.findOne.mockResolvedValue(member);

      const result = await service.findByUserId('user1');
      expect(result).toEqual(member);
      expect(mockFamilyRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { user: { id: 'user1' } }
      }));
    });
  });

  describe('findById', () => {
    it('should find a family member by id', async () => {
      const member = { id: 'fam1' };
      mockFamilyRepo.findOne.mockResolvedValue(member);

      const result = await service.findById('fam1');
      expect(result).toEqual(member);
    });

    it('should throw NotFoundException if member not found', async () => {
      mockFamilyRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('fam1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all family members', async () => {
      const members = [{ id: 'fam1' }, { id: 'fam2' }];
      mockFamilyRepo.find.mockResolvedValue(members);

      const result = await service.findAll();
      expect(result).toEqual(members);
    });
  });

  describe('updateProfileByUserId', () => {
    it('should update user profile through usersService', async () => {
      const member = { id: 'fam1', user: { id: 'user1' } };
      mockFamilyRepo.findOne.mockResolvedValue(member);
      mockUsersService.update.mockResolvedValue(true);

      await service.updateProfileByUserId('user1', { fullName: 'New Name' });
      
      expect(mockUsersService.update).toHaveBeenCalledWith('user1', { fullName: 'New Name' });
    });

    it('should throw NotFoundException if family member not found', async () => {
      mockFamilyRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfileByUserId('user1', { fullName: 'New Name' }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
