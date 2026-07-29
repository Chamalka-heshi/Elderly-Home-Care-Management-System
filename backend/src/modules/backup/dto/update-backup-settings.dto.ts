import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateBackupSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoBackupEnabled?: boolean;

  @IsOptional()
  @IsIn(['hourly', '6hours', 'daily', 'weekly', 'monthly'])
  frequency?: string;

  @IsOptional()
  @IsString()
  backupTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxBackupsToKeep?: number;

  @IsOptional()
  @IsBoolean()
  compressionEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  includeDatabase?: boolean;

  @IsOptional()
  @IsBoolean()
  includeFiles?: boolean;

  @IsOptional()
  @IsString()
  backupLocation?: string;

  @IsOptional()
  @IsEmail()
  emailNotification?: string;
}
