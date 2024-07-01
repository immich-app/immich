import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
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
  @ApiExcludeEndpoint()
  getAboutInfo(): Promise<ServerAboutResponseDto> {
    return this.service.getAboutInfo();
  }

  @Get('storage')
  @Authenticated()
  @ApiExcludeEndpoint()
  getStorage(): Promise<ServerStorageResponseDto> {
    return this.service.getStorage();
  }

  @Get('ping')
  @ApiExcludeEndpoint()
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  @ApiExcludeEndpoint()
  getServerVersion(): ServerVersionResponseDto {
    return this.versionService.getVersion();
  }

  @Get('features')
  @ApiExcludeEndpoint()
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @Get('theme')
  @ApiExcludeEndpoint()
  getTheme(): Promise<ServerThemeDto> {
    return this.service.getTheme();
  }

  @Get('config')
  @ApiExcludeEndpoint()
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getConfig();
  }

  @Authenticated({ admin: true })
  @Get('statistics')
  @ApiExcludeEndpoint()
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  @ApiExcludeEndpoint()
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
  getServerLicense(): Promise<LicenseKeyDto | null> {
    return this.service.getLicense();
  }
}
