import { Body, Controller, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { UpdateFFmpegSystemConfigDto } from './dto/update-ffmpeg-system-config.dto';
import { UpdateOAuthSystemConfigDto } from './dto/update-oauth-system-config.dto';
import { FFmpegSystemConfigResponseDto } from './response-dto/ffmpeg-system-config-response.dto';
import { OAuthSystemConfigResponseDto } from './response-dto/oauth-system-config-response.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth()
@Authenticated({ admin: true })
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('ffmpeg')
  getFFmpegConfig(): Promise<FFmpegSystemConfigResponseDto> {
    return this.systemConfigService.getFFmpegConfig();
  }

  @Put('ffmpeg')
  updateFFmpegConfig(@Body(ValidationPipe) dto: UpdateFFmpegSystemConfigDto): Promise<FFmpegSystemConfigResponseDto> {
    return this.systemConfigService.updateFFmpegConfig(dto);
  }

  @Get('oauth')
  getOAuthConfig(): Promise<OAuthSystemConfigResponseDto> {
    return this.systemConfigService.getOAuthConfig();
  }

  @Put('oauth')
  updateOAuthConfig(@Body(ValidationPipe) dto: UpdateOAuthSystemConfigDto): Promise<OAuthSystemConfigResponseDto> {
    return this.systemConfigService.updateOAuthConfig(dto);
  }
}
