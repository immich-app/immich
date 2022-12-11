import { SystemConfig } from '@app/database/entities/system-config.entity';
import { ValidateNested } from 'class-validator';
import { SystemConfigFFmpegDto } from './system-config-ffmpeg.dto';
import { SystemConfigOAuthDto } from './system-config-oauth.dto';

export class SystemConfigDto {
  @ValidateNested()
  ffmpeg!: SystemConfigFFmpegDto;

  @ValidateNested()
  oauth!: SystemConfigOAuthDto;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
