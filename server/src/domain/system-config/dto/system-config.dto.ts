import { SystemConfigThumbnailDto } from '@app/domain/system-config';
import { SystemConfig } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { boolean } from 'joi';
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

  @Type(() => SystemConfigThumbnailDto)
  @ValidateNested()
  @IsObject()
  thumbnail!: SystemConfigThumbnailDto;

  @Type(() => Boolean)
  @IsBoolean()
  @ApiProperty({ type: boolean })
  isConfigFile!: boolean;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
