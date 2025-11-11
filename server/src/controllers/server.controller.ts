import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { ServerService } from 'src/services/server.service';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { VersionService } from 'src/services/version.service';

@ApiTags(ApiTag.Server)
@Controller('server')
export class ServerController {
  constructor(
    private service: ServerService,
    private systemMetadataService: SystemMetadataService,
    private versionService: VersionService,
  ) {}

  @Get('about')
  @Authenticated({ permission: Permission.ServerAbout })
  @ApiOperation({ summary: 'Get server information', description: 'Retrieve a list of information about the server.' })
  getAboutInfo(): Promise<ServerAboutResponseDto> {
    return this.service.getAboutInfo();
  }

  @Get('apk-links')
  @Authenticated({ permission: Permission.ServerApkLinks })
  @ApiOperation({ summary: 'Get APK links', description: 'Retrieve links to the APKs for the current server version.' })
  getApkLinks(): ServerApkLinksDto {
    return this.service.getApkLinks();
  }

  @Get('storage')
  @Authenticated({ permission: Permission.ServerStorage })
  @ApiOperation({
    summary: 'Get storage',
    description: 'Retrieve the current storage utilization information of the server.',
  })
  getStorage(): Promise<ServerStorageResponseDto> {
    return this.service.getStorage();
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping', description: 'Pong' })
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  @ApiOperation({
    summary: 'Get server version',
    description: 'Retrieve the current server version in semantic versioning (semver) format.',
  })
  getServerVersion(): ServerVersionResponseDto {
    return this.versionService.getVersion();
  }

  @Get('version-history')
  @ApiOperation({
    summary: 'Get version history',
    description: 'Retrieve a list of past versions the server has been on.',
  })
  getVersionHistory(): Promise<ServerVersionHistoryResponseDto[]> {
    return this.versionService.getVersionHistory();
  }

  @Get('features')
  @ApiOperation({ summary: 'Get features', description: 'Retrieve available features supported by this server.' })
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @Get('theme')
  @ApiOperation({ summary: 'Get theme', description: 'Retrieve the custom CSS, if existent.' })
  getTheme(): Promise<ServerThemeDto> {
    return this.service.getTheme();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get config', description: 'Retrieve the current server configuration.' })
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getSystemConfig();
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.ServerStatistics, admin: true })
  @ApiOperation({
    summary: 'Get statistics',
    description: 'Retrieve statistics about the entire Immich instance such as asset counts.',
  })
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  @ApiOperation({
    summary: 'Get supported media types',
    description: 'Retrieve all media types supported by the server.',
  })
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }

  @Get('license')
  @Authenticated({ permission: Permission.ServerLicenseRead, admin: true })
  @ApiNotFoundResponse()
  @ApiOperation({
    summary: 'Get product key',
    description: 'Retrieve information about whether the server currently has a product key registered.',
  })
  getServerLicense(): Promise<LicenseResponseDto> {
    return this.service.getLicense();
  }

  @Put('license')
  @Authenticated({ permission: Permission.ServerLicenseUpdate, admin: true })
  @ApiOperation({
    summary: 'Set server product key',
    description: 'Validate and set the server product key if successful.',
  })
  setServerLicense(@Body() license: LicenseKeyDto): Promise<LicenseResponseDto> {
    return this.service.setLicense(license);
  }

  @Delete('license')
  @Authenticated({ permission: Permission.ServerLicenseDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete server product key', description: 'Delete the currently set server product key.' })
  deleteServerLicense(): Promise<void> {
    return this.service.deleteLicense();
  }

  @Get('version-check')
  @Authenticated({ permission: Permission.ServerVersionCheck })
  @ApiOperation({
    summary: 'Get version check status',
    description: 'Retrieve information about the last time the version check ran.',
  })
  getVersionCheck(): Promise<VersionCheckStateResponseDto> {
    return this.systemMetadataService.getVersionCheckState();
  }
}
