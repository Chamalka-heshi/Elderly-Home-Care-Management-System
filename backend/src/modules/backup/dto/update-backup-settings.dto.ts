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

// Only the five settings that remain after removing storage/compression/scope toggles
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
  @IsEmail()
  emailNotification?: string;
}
