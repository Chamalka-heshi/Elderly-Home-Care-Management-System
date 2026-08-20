/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, Not, IsNull } from 'typeorm';
import { Patient }          from './entities/patient.entity';
import { FamilyMember }     from '../family/entities/family-member.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { VitalRecord }      from '../caregivers/entities/vital-record.entity';
import { Prescription }     from '../prescription/entities/prescription.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
    @InjectRepository(VitalRecord)
    private vitalRecordRepository: Repository<VitalRecord>,
    @InjectRepository(Prescription)
    private prescriptionRepository: Repository<Prescription>,
  ) {}

//Registers a new patient under a family member's oversight while enforcing unique identity constraints
  async create(
    familyMemberId: string,
    createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    const fm = await this.familyMemberRepository.findOne({ where: { id: familyMemberId } });
    if (!fm) throw new NotFoundException('Family member not found');

    const patient = this.patientsRepository.create({
      ...createPatientDto,
      familyMemberId,
    });

    try {
      return await this.patientsRepository.save(patient);
    } catch (err: any) {
      if (
        err instanceof QueryFailedError &&
        (err as any).code === '23505' 
      ) {
        throw new ConflictException(
          'A patient with this NIC number already exists. Please check the NIC and try again.',
        );
      }
      throw err;
    }
  }

//Retrieves all patients associated with a specific family account for localized management
  async findAllByFamily(familyMemberId: string): Promise<Patient[]> {
    return this.patientsRepository.find({
      where: { familyMemberId },
      order: { createdAt: 'DESC' },
    });
  }

//Returns granular details for a single patient to support clinical and administrative reviews
  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['familyMember'],
    });

    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

//Ensures a patient record belongs to the requesting family member to enforce data ownership boundaries
  async findOneByFamily(id: string, familyMemberId: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id, familyMemberId },
    });
    if (!patient) throw new NotFoundException('Patient not found or does not belong to your account');
    return patient;
  }

//Permits family members to modify patient details while maintaining strict ownership verification
  async update(
    id: string,
    familyMemberId: string,
    updateData: Partial<CreatePatientDto>,
  ): Promise<Patient> {
    const patient = await this.findOne(id);

    if (patient.familyMemberId !== familyMemberId) {
      throw new ForbiddenException('You can only update your own patients');
    }

    await this.patientsRepository.update(id, updateData);
    return this.findOne(id);
  }

//Removes a patient record from the system after verifying the requesting user's authorization
  async delete(id: string, familyMemberId: string): Promise<void> {
    const patient = await this.findOne(id);

    if (patient.familyMemberId !== familyMemberId) {
      throw new ForbiddenException('You can only delete your own patients');
    }

    await this.patientsRepository.delete(id);
  }

//Provides a global view of all system patients for administrative oversight and reporting
  async findAll(): Promise<Patient[]> {
    return this.patientsRepository.find({
      relations: ['familyMember'],
      order: { createdAt: 'DESC' },
    });
  }

//Returns only patients who have purchased a care plan, for caregiver assignment view
  async findAllWithPlan(): Promise<Patient[]> {
    return this.patientsRepository.find({
      where: { paymentPlan: Not(IsNull()) },
      relations: ['familyMember'],
      order: { createdAt: 'DESC' },
    });
  }

  //Retrieves care-plan registered patients who have active doctor prescriptions
  async findAssignedWithActivePrescriptions(): Promise<{
    patients: Patient[];
    prescriptions: Prescription[];
  }> {
    const patients = await this.patientsRepository.find({
      where: { paymentPlan: Not(IsNull()) },
      relations: ['familyMember'],
      order: { createdAt: 'DESC' },
    });

    if (!patients.length) {
      return { patients: [], prescriptions: [] };
    }

    const patientIds = patients.map((p) => p.id);
    const patientNames = patients.map((p) => p.fullName.trim().toLowerCase());

    const prescriptions = await this.prescriptionRepository
      .createQueryBuilder('rx')
      .leftJoinAndSelect('rx.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .where('(LOWER(rx.status) = :status OR rx.status IS NULL)', { status: 'active' })
      .andWhere(
        '(rx.patientId IN (:...patientIds) OR LOWER(TRIM(rx.patientName)) IN (:...patientNames))',
        { patientIds, patientNames },
      )
      .orderBy('rx.createdAt', 'DESC')
      .getMany();

    // Map patientId for prescriptions matched by patientName
    prescriptions.forEach((rx) => {
      if (!rx.patientId || !patientIds.includes(rx.patientId)) {
        const matched = patients.find(
          (p) => p.fullName.trim().toLowerCase() === rx.patientName?.trim().toLowerCase(),
        );
        if (matched) {
          rx.patientId = matched.id;
        }
      }
    });

    const activePatientIds = new Set(
      prescriptions
        .filter((rx) => (rx.medicines ?? []).length > 0 && rx.patientId)
        .map((rx) => rx.patientId),
    );

    const filteredPatients = patients.filter((p) => activePatientIds.has(p.id));

    return {
      patients: filteredPatients,
      prescriptions,
    };
  }

//Updates the financial coverage level for a patient to unlock advanced care features
  async setPaymentPlan(
    patientId: string,
    familyMemberUserId: string,
    plan: string,
  ): Promise<Patient> {
    const fm = await this.familyMemberRepository.findOne({
      where: { user: { id: familyMemberUserId } },
      relations: ['user'],
    });
    if (!fm) throw new NotFoundException('Family member not found');
    const patient = await this.findOneByFamily(patientId, fm.id);
    patient.paymentPlan = plan;
    return this.patientsRepository.save(patient);
  }

//Aggregates clinical records and medication history to provide doctors with a complete patient overview
  async getMedicalHistory(patientId: string): Promise<{
    patient: Patient;
    vitalRecords: VitalRecord[];
    prescriptions: Prescription[];
  }> {
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      relations: ['familyMember'],
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const [vitalRecords, prescriptions] = await Promise.all([
      this.vitalRecordRepository.find({
        where: { patientId },
        order: { recordedAt: 'DESC' },
      }),
      this.prescriptionRepository.find({
        where: { patientId },
        order: { createdAt: 'DESC' },
        relations: ['doctor', 'doctor.user'],
      }),
    ]);

    return { patient, vitalRecords, prescriptions };
  }
}