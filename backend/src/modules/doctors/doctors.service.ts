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
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto'; 
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
    const { email, password, fullName, contactNumber, ...doctorData } = createDoctorDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.usersService.create(
      email,
      password,
      UserRole.DOCTOR,
      fullName,
      contactNumber,
    );

    const doctor = this.doctorRepository.create({
      user,
      specialization: doctorData.specialization,
      licenseNumber: doctorData.licenseNumber,
      qualification: doctorData.qualification || 'MBBS',
      experienceYears: doctorData.experienceYears,
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
      order: { user: { createdAt: 'DESC' } },
    });
  }

  async findAllActive(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: { user: { isActive: true } },
      relations: ['user'],
      order: { user: { createdAt: 'DESC' } },
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

  // ── NEW: Profile Update Logic for the Logged-in Doctor ──
  async updateProfileByUserId(userId: string, updateData: UpdateDoctorProfileDto) {
    const doctor = await this.findByUserId(userId);
    
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    // 1. Update Base User Data
    if (updateData.fullName) doctor.user.fullName = updateData.fullName;
    if (updateData.contactNumber) doctor.user.contactNumber = updateData.contactNumber;

    // 2. Update Doctor Professional Data
    if (updateData.specialization) doctor.specialization = updateData.specialization;
    if (updateData.licenseNumber) doctor.licenseNumber = updateData.licenseNumber;
    if (updateData.qualification !== undefined) doctor.qualification = updateData.qualification;
    
    // Note: DTO uses yearsOfExperience, Entity uses experienceYears
    if (updateData.experienceYears !== undefined) doctor.experienceYears = updateData.experienceYears;

    // Save cascades to the User entity automatically based on your existing setup
    const updatedDoctor = await this.doctorRepository.save(doctor);

    // 3. Return the exact shape the Frontend `User` context expects
    return {
      id: updatedDoctor.user.id,
      fullName: updatedDoctor.user.fullName,
      email: updatedDoctor.user.email,
      role: updatedDoctor.user.role,
      contactNumber: updatedDoctor.user.contactNumber,
      profile: updatedDoctor,
    };
  }

  async deactivate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.deactivateUser(doctor.user.id);
  }

  async activate(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.usersService.activateUser(doctor.user.id);
  }

  async setAvailability(userId: string, availableDays: string[], availableTimeStart: string, availableTimeEnd: string): Promise<Doctor> {
    const doctor = await this.findByUserId(userId);
    if (!doctor) throw new NotFoundException('Doctor not found');

    doctor.availableDays = availableDays;
    doctor.availableTimeStart = availableTimeStart;
    doctor.availableTimeEnd = availableTimeEnd;

    return this.doctorRepository.save(doctor);
  }
}