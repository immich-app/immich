import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EndpointLifecycle } from 'src/decorators';
import {
  ServerAboutResponseDto,
  ServerConfigDto,
  ServerFeaturesDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  ServerStorageResponseDto,
  ServerThemeDto,
  ServerVersionResponseDto,
} from 'src/dtos/server.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { ServerService } from 'src/services/server.service';
import { VersionService } from 'src/services/version.service';

@ApiTags('Server Info')
@Controller('server-info')
export class ServerInfoController {
  constructor(
    private service: ServerService,
    private versionService: VersionService,
  ) {}

  @Get('about')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  @Authenticated()
  getAboutInfo(): Promise<ServerAboutResponseDto> {
    return this.service.getAboutInfo();
  }

  @Get('storage')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  @Authenticated()
  getStorage(): Promise<ServerStorageResponseDto> {
    return this.service.getStorage();
  }

  @Get('ping')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  getServerVersion(): ServerVersionResponseDto {
    return this.versionService.getVersion();
  }

  @Get('features')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @Get('theme')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  getTheme(): Promise<ServerThemeDto> {
    return this.service.getTheme();
  }

  @Get('config')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getConfig();
  }

  @Authenticated({ admin: true })
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  @Get('statistics')
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  @EndpointLifecycle({ deprecatedAt: 'v1.107.0' })
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }
}
