import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
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
  @Endpoint({
    summary: 'Get server information',
    description: 'Retrieve a list of information about the server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAboutInfo(): Promise<ServerAboutResponseDto> {
    return this.service.getAboutInfo();
  }

  @Get('apk-links')
  @Authenticated({ permission: Permission.ServerApkLinks })
  @Endpoint({
    summary: 'Get APK links',
    description: 'Retrieve links to the APKs for the current server version.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getApkLinks(): ServerApkLinksDto {
    return this.service.getApkLinks();
  }

  @Get('storage')
  @Authenticated({ permission: Permission.ServerStorage })
  @Endpoint({
    summary: 'Get storage',
    description: 'Retrieve the current storage utilization information of the server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getStorage(): Promise<ServerStorageResponseDto> {
    return this.service.getStorage();
  }

  @Get('ping')
  @Endpoint({
    summary: 'Ping',
    description: 'Pong',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  @Endpoint({
    summary: 'Get server version',
    description: 'Retrieve the current server version in semantic versioning (semver) format.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerVersion(): ServerVersionResponseDto {
    return this.versionService.getVersion();
  }

  @Get('version-history')
  @Endpoint({
    summary: 'Get version history',
    description: 'Retrieve a list of past versions the server has been on.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getVersionHistory(): Promise<ServerVersionHistoryResponseDto[]> {
    return this.versionService.getVersionHistory();
  }

  @Get('features')
  @Endpoint({
    summary: 'Get features',
    description: 'Retrieve available features supported by this server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @Get('theme')
  @Endpoint({
    summary: 'Get theme',
    description: 'Retrieve the custom CSS, if existent.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getTheme(): Promise<ServerThemeDto> {
    return this.service.getTheme();
  }

  @Get('config')
  @Endpoint({
    summary: 'Get config',
    description: 'Retrieve the current server configuration.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getSystemConfig();
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.ServerStatistics, admin: true })
  @Endpoint({
    summary: 'Get statistics',
    description: 'Retrieve statistics about the entire Immich instance such as asset counts.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  @Endpoint({
    summary: 'Get supported media types',
    description: 'Retrieve all media types supported by the server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }

  @Get('license')
  @Authenticated({ permission: Permission.ServerLicenseRead, admin: true })
  @ApiNotFoundResponse()
  @Endpoint({
    summary: 'Get product key',
    description: 'Retrieve information about whether the server currently has a product key registered.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerLicense(): Promise<LicenseResponseDto> {
    return this.service.getLicense();
  }

  @Put('license')
  @Authenticated({ permission: Permission.ServerLicenseUpdate, admin: true })
  @Endpoint({
    summary: 'Set server product key',
    description: 'Validate and set the server product key if successful.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  setServerLicense(@Body() license: LicenseKeyDto): Promise<LicenseResponseDto> {
    return this.service.setLicense(license);
  }

  @Delete('license')
  @Authenticated({ permission: Permission.ServerLicenseDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete server product key',
    description: 'Delete the currently set server product key.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteServerLicense(): Promise<void> {
    return this.service.deleteLicense();
  }

  @Get('version-check')
  @Authenticated({ permission: Permission.ServerVersionCheck })
  @Endpoint({
    summary: 'Get version check status',
    description: 'Retrieve information about the last time the version check ran.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getVersionCheck(): Promise<VersionCheckStateResponseDto> {
    return this.systemMetadataService.getVersionCheckState();
  }
}
