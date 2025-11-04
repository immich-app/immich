import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import {
  ServerAboutResponseDto,
  ServerApkLinksDto,
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
import { VersionCheckStateResponseDto } from 'src/dtos/system-metadata.dto';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { ServerService } from 'src/services/server.service';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { VersionService } from 'src/services/version.service';

@ApiTags('Server')
@Controller('server')
export class ServerController {
  constructor(
    private service: ServerService,
    private systemMetadataService: SystemMetadataService,
    private versionService: VersionService,
  ) {}

  @Get('about')
  @Authenticated({ permission: Permission.ServerAbout })
  getAboutInfo(): Promise<ServerAboutResponseDto> {
    return this.service.getAboutInfo();
  }

  @Get('apk-links')
  @Authenticated({ permission: Permission.ServerApkLinks })
  getApkLinks(): ServerApkLinksDto {
    return this.service.getApkLinks();
  }

  @Get('storage')
  @Authenticated({ permission: Permission.ServerStorage })
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
  @Authenticated({ permission: Permission.ServerStatistics, admin: true })
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }

  @Get('license')
  @Authenticated({ permission: Permission.ServerLicenseRead, admin: true })
  @ApiNotFoundResponse()
  getServerLicense(): Promise<LicenseResponseDto> {
    return this.service.getLicense();
  }

  @Put('license')
  @Authenticated({ permission: Permission.ServerLicenseUpdate, admin: true })
  setServerLicense(@Body() license: LicenseKeyDto): Promise<LicenseResponseDto> {
    return this.service.setLicense(license);
  }

  @Delete('license')
  @Authenticated({ permission: Permission.ServerLicenseDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteServerLicense(): Promise<void> {
    return this.service.deleteLicense();
  }

  @Get('version-check')
  @Authenticated({ permission: Permission.ServerVersionCheck })
  getVersionCheck(): Promise<VersionCheckStateResponseDto> {
    return this.systemMetadataService.getVersionCheckState();
  }
}
