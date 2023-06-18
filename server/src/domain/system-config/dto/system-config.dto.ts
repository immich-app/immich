import { SystemConfig } from '@app/infra/entities';
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { SystemConfigFFmpegDto } from './system-config-ffmpeg.dto';
import { SystemConfigJobDto } from './system-config-job.dto';
import { SystemConfigOAuthDto } from './system-config-oauth.dto';
import { SystemConfigPasswordLoginDto } from './system-config-password-login.dto';
import { SystemConfigStorageTemplateDto } from './system-config-storage-template.dto';

export class SystemConfigDto {
  @Type(() => SystemConfigFFmpegDto)
  @ValidateNested()
  @IsObject()
  ffmpeg!: SystemConfigFFmpegDto;

  @Type(() => SystemConfigOAuthDto)
  @ValidateNested()
  @IsObject()
  oauth!: SystemConfigOAuthDto;

  @Type(() => SystemConfigPasswordLoginDto)
  @ValidateNested()
  @IsObject()
  passwordLogin!: SystemConfigPasswordLoginDto;

  @Type(() => SystemConfigStorageTemplateDto)
  @ValidateNested()
  @IsObject()
  storageTemplate!: SystemConfigStorageTemplateDto;

  @Type(() => SystemConfigJobDto)
  @ValidateNested()
  @IsObject()
  job!: SystemConfigJobDto;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
