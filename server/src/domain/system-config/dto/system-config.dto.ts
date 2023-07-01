import { SystemConfig } from '@app/infra/entities/index.js';
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { SystemConfigFFmpegDto } from './system-config-ffmpeg.dto.js';
import { SystemConfigJobDto } from './system-config-job.dto.js';
import { SystemConfigOAuthDto } from './system-config-oauth.dto.js';
import { SystemConfigPasswordLoginDto } from './system-config-password-login.dto.js';
import { SystemConfigStorageTemplateDto } from './system-config-storage-template.dto.js';

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
