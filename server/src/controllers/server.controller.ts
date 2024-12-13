import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import {
  ServerAboutResponseDto,
  ServerConfigDto,
  ServerFeaturesDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  ServerStorageResponseDto,
  ServerThemeDto,
  ServerVersionHistoryResponseDto,
  ServerVersionResponseDto,
} from 'src/dtos/server.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { ServerService } from 'src/services/server.service';
import { VersionService } from 'src/services/version.service';

@ApiTags('Server')
@Controller('server')
export class ServerController {
  constructor(
    private service: ServerService,
    private versionService: VersionService,
  ) {}

  @Get('about')
  @Authenticated()
  getAboutInfo(): Promise<ServerAboutResponseDto> {
    return this.service.getAboutInfo();
  }

  @Get('storage')
  @Authenticated()
  getStorage(): Promise<ServerStorageResponseDto> {
    return this.service.getStorage();
  }

  @Get('ping')
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  getServerVersion(): ServerVersionResponseDto {
    return this.versionService.getVersion();
  }

  @Get('version-history')
  getVersionHistory(): Promise<ServerVersionHistoryResponseDto[]> {
    return this.versionService.getVersionHistory();
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
    return this.service.getSystemConfig();
  }

  @Get('statistics')
  @Authenticated({ admin: true })
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }

  @Put('license')
  @Authenticated({ admin: true })
  setServerLicense(@Body() license: LicenseKeyDto): Promise<LicenseResponseDto> {
    return this.service.setLicense(license);
  }

  @Delete('license')
  @Authenticated({ admin: true })
  deleteServerLicense(): Promise<void> {
    return this.service.deleteLicense();
  }

  @Get('license')
  @Authenticated({ admin: true })
  @ApiNotFoundResponse()
  getServerLicense(): Promise<LicenseResponseDto> {
    return this.service.getLicense();
  }
}
