import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyService } from './family.service';
import { FamilyMember } from './entities/family-member.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyMember]), UsersModule],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}
