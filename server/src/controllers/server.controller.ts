import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiBody, ApiNotFoundResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved server information',
    type: ServerAboutResponseDto,
  })
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
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved APK links', type: ServerApkLinksDto })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved storage information',
    type: ServerStorageResponseDto,
  })
  @Endpoint({
    summary: 'Get storage',
    description: 'Retrieve the current storage utilization information of the server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getStorage(): Promise<ServerStorageResponseDto> {
    return this.service.getStorage();
  }

  @Get('ping')
  @ApiResponse({ status: HttpStatus.OK, description: 'Pong', type: ServerPingResponse })
  @Endpoint({
    summary: 'Ping',
    description: 'Pong',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved server version',
    type: ServerVersionResponseDto,
  })
  @Endpoint({
    summary: 'Get server version',
    description: 'Retrieve the current server version in semantic versioning (semver) format.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerVersion(): ServerVersionResponseDto {
    return this.versionService.getVersion();
  }

  @Get('version-history')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved version history',
    type: [ServerVersionHistoryResponseDto],
  })
  @Endpoint({
    summary: 'Get version history',
    description: 'Retrieve a list of past versions the server has been on.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getVersionHistory(): Promise<ServerVersionHistoryResponseDto[]> {
    return this.versionService.getVersionHistory();
  }

  @Get('features')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved server features',
    type: ServerFeaturesDto,
  })
  @Endpoint({
    summary: 'Get features',
    description: 'Retrieve available features supported by this server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @Get('theme')
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved theme', type: ServerThemeDto })
  @Endpoint({
    summary: 'Get theme',
    description: 'Retrieve the custom CSS, if existent.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getTheme(): Promise<ServerThemeDto> {
    return this.service.getTheme();
  }

  @Get('config')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved server configuration',
    type: ServerConfigDto,
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved server statistics',
    type: ServerStatsResponseDto,
  })
  @Endpoint({
    summary: 'Get statistics',
    description: 'Retrieve statistics about the entire Immich instance such as asset counts.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerStatistics(): Promise<ServerStatsResponseDto> {
    return this.service.getStatistics();
  }

  @Get('media-types')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved supported media types',
    type: ServerMediaTypesResponseDto,
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved server license',
    type: LicenseResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Server license not found' })
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
  @ApiBody({ description: 'Product key to register', type: LicenseKeyDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Server license set successfully', type: LicenseResponseDto })
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
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Server license deleted successfully' })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved version check status',
    type: VersionCheckStateResponseDto,
  })
  @Endpoint({
    summary: 'Get version check status',
    description: 'Retrieve information about the last time the version check ran.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getVersionCheck(): Promise<VersionCheckStateResponseDto> {
    return this.systemMetadataService.getVersionCheckState();
  }
}
