import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ServerConfigDto,
  ServerFeaturesDto,
  ServerInfoResponseDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  ServerThemeDto,
  ServerVersionResponseDto,
} from 'src/domain/server-info/server-info.dto';
import { ServerInfoService } from 'src/domain/server-info/server-info.service';
import { AdminRoute, Authenticated, PublicRoute } from 'src/immich/app.guard';

@ApiTags('Server Info')
@Controller('server-info')
@Authenticated()
export class ServerInfoController {
  constructor(private service: ServerInfoService) {}

  @Get()
  getServerInfo(): Promise<ServerInfoResponseDto> {
    return this.service.getInfo();
  }

  @PublicRoute()
  @Get('ping')
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @PublicRoute()
  @Get('version')
  getServerVersion(): ServerVersionResponseDto {
    return this.service.getVersion();
  }

  @PublicRoute()
  @Get('features')
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @PublicRoute()
  @Get('theme')
  getTheme(): Promise<ServerThemeDto> {
    return this.service.getTheme();
  }

  @PublicRoute()
  @Get('config')
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getConfig();
  }

  @AdminRoute()
  @Get('statistics')
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @PublicRoute()
  @Get('media-types')
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }

  @AdminRoute()
  @Post('admin-onboarding')
  @HttpCode(HttpStatus.NO_CONTENT)
  setAdminOnboarding(): Promise<void> {
    return this.service.setAdminOnboarding();
  }
}
