import { SystemConfig } from '@app/infra/entities';
import { ValidateNested } from 'class-validator';
import { SystemConfigFFmpegDto } from './system-config-ffmpeg.dto';
import { SystemConfigOAuthDto } from './system-config-oauth.dto';
import { SystemConfigPasswordLoginDto } from './system-config-password-login.dto';
import { SystemConfigStorageTemplateDto } from './system-config-storage-template.dto';

export class SystemConfigDto {
  @ValidateNested()
  ffmpeg!: SystemConfigFFmpegDto;

  @ValidateNested()
  oauth!: SystemConfigOAuthDto;

  @ValidateNested()
  passwordLogin!: SystemConfigPasswordLoginDto;

  @ValidateNested()
  storageTemplate!: SystemConfigStorageTemplateDto;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
