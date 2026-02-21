/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private usersService: UsersService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const { email, password, ...doctorData } = createDoctorDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.usersService.create(email, password, UserRole.DOCTOR);

    const doctor = this.doctorRepository.create({
      user,
      fullName: doctorData.fullName,
      specialization: doctorData.specialization,
      licenseNumber: doctorData.licenseNumber,
      qualification: doctorData.qualification || 'MBBS',
      experienceYears: doctorData.yearsOfExperience || 0,
      contactNumber: doctorData.contactNumber,
      hospitalAffiliation: doctorData.hospitalAffiliation,
      consultationFee: doctorData.consultationFee,
      availableDays: doctorData.availableDays,
      availableTimeStart: doctorData.availableTimeStart,
      availableTimeEnd: doctorData.availableTimeEnd,
    });

    return this.doctorRepository.save(doctor);
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: { user: { isActive: true } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    return this.doctorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: string, updateData: Partial<CreateDoctorDto>): Promise<Doctor> {
    const doctor = await this.findOne(id);

    if (updateData.fullName) doctor.fullName = updateData.fullName;
    if (updateData.specialization) doctor.specialization = updateData.specialization;
    if (updateData.licenseNumber) doctor.licenseNumber = updateData.licenseNumber;
    if (updateData.yearsOfExperience !== undefined) doctor.experienceYears = updateData.yearsOfExperience;
    if (updateData.contactNumber) doctor.contactNumber = updateData.contactNumber;
    if (updateData.hospitalAffiliation) doctor.hospitalAffiliation = updateData.hospitalAffiliation;
    if (updateData.consultationFee !== undefined) doctor.consultationFee = updateData.consultationFee;
    if (updateData.availableDays) doctor.availableDays = updateData.availableDays;
    if (updateData.availableTimeStart) doctor.availableTimeStart = updateData.availableTimeStart;
    if (updateData.availableTimeEnd) doctor.availableTimeEnd = updateData.availableTimeEnd;

    return this.doctorRepository.save(doctor);
  }

  /**
   * Deactivate is handled entirely via User.isActive — single source of truth.
   */
  async deactivate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.deactivateUser(doctor.user.id);
  }

  async activate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.activateUser(doctor.user.id);
  }
}
