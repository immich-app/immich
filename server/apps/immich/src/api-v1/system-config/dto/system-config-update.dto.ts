import { IsOptional, ValidateNested } from 'class-validator';
import { SystemConfigUpdateFFmpegDto } from './system-config-update-ffmpeg.dto';
import { SystemConfigUpdateOAuthDto } from './system-config-update-oauth.dto';

export class SystemConfigUpdateDto {
  @ValidateNested()
  @IsOptional()
  ffmpeg?: SystemConfigUpdateFFmpegDto;

  @ValidateNested()
  @IsOptional()
  oauth?: SystemConfigUpdateOAuthDto;
}
