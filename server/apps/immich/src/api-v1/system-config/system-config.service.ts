import { Injectable } from '@nestjs/common';
import { ImmichConfigService } from 'libs/immich-config/src';
import { UpdateFFmpegSystemConfigDto } from './dto/update-ffmpeg-system-config.dto';
import { UpdateOAuthSystemConfigDto } from './dto/update-oauth-system-config.dto';
import { FFmpegSystemConfigResponseDto, mapFFmpegConfig } from './response-dto/ffmpeg-system-config-response.dto';
import { mapOAuthConfig, OAuthSystemConfigResponseDto } from './response-dto/oauth-system-config-response.dto';

@Injectable()
export class SystemConfigService {
  constructor(private immichConfigService: ImmichConfigService) {}

  async getFFmpegConfig(): Promise<FFmpegSystemConfigResponseDto> {
    const config = await this.immichConfigService.getFFmpegConfig();
    return mapFFmpegConfig(config);
  }

  async getOAuthConfig(): Promise<OAuthSystemConfigResponseDto> {
    const config = await this.immichConfigService.getOAuthConfig();
    return mapOAuthConfig(config);
  }

  async updateOAuthConfig(dto: UpdateOAuthSystemConfigDto): Promise<OAuthSystemConfigResponseDto> {
    await this.immichConfigService.updateOAuthConfig(dto);
    return this.getOAuthConfig();
  }

  async updateFFmpegConfig(dto: UpdateFFmpegSystemConfigDto): Promise<FFmpegSystemConfigResponseDto> {
    await this.immichConfigService.updateFFmpegConfig(dto);
    return this.getFFmpegConfig();
  }
}
