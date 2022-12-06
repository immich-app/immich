import { SystemConfig } from '@app/database/entities/system-config.entity';
import { SystemFFmpegConfigResponseDto } from './system-config-ffmpeg-response.dto';
import { SystemOAuthConfigResponseDto } from './system-config-oauth-response.dto';

export class SystemConfigResponseDto {
  oauth!: SystemOAuthConfigResponseDto;
  ffmpeg!: SystemFFmpegConfigResponseDto;
}

export function mapConfig(config: SystemConfig): SystemConfigResponseDto {
  return config;
}
