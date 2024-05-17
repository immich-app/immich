import { Controller, Get } from '@nestjs/common';
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
} from 'src/dtos/server-info.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { ServerInfoService } from 'src/services/server-info.service';
import { VersionService } from 'src/services/version.service';

@ApiTags('Server Info')
@Controller('server-info')
export class ServerInfoController {
  constructor(
    private service: ServerInfoService,
    private versionService: VersionService,
  ) {}

  @Get()
  @Authenticated()
  getServerInfo(): Promise<ServerInfoResponseDto> {
    return this.service.getInfo();
  }

  @Get('ping')
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  getServerVersion(): ServerVersionResponseDto {
    return this.versionService.getVersion();
  }

  @Get('features')
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @Get('theme')
  getTheme(): Promise<ServerThemeDto> {
    return this.service.getTheme();
  }

  @Get('config')
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getConfig();
  }

  @Authenticated({ admin: true })
  @Get('statistics')
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }
}
