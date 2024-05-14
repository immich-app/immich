import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { isDev, serverVersion } from 'src/constants';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnServerEvent } from 'src/decorators';
import {
  ServerConfigDto,
  ServerFeaturesDto,
  ServerInfoResponseDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  UsageByUserDto,
} from 'src/dtos/server-info.dto';
import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
import { ClientEvent, IEventRepository, ServerEvent, ServerEventMap } from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository, UserStatsQueryResponse } from 'src/interfaces/user.interface';
import { asHumanReadable } from 'src/utils/bytes';
import { mimeTypes } from 'src/utils/mime-types';
import { isFacialRecognitionEnabled, isSmartSearchEnabled } from 'src/utils/misc';
import { Version } from 'src/utils/version';

@Injectable()
export class ServerInfoService {
  private configCore: SystemConfigCore;
  private releaseVersion = serverVersion;
  private releaseVersionCheckedAt: DateTime | null = null;

  constructor(
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IServerInfoRepository) private repository: IServerInfoRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) private systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(ServerInfoService.name);
    this.configCore = SystemConfigCore.create(configRepository, this.logger);
  }

  onConnect() {}

  async init(): Promise<void> {
    await this.handleVersionCheck();

    const featureFlags = await this.getFeatures();
    if (featureFlags.configFile) {
      await this.systemMetadataRepository.set(SystemMetadataKey.ADMIN_ONBOARDING, {
        isOnboarded: true,
      });
    }
  }

  async getInfo(): Promise<ServerInfoResponseDto> {
    const libraryBase = StorageCore.getBaseFolder(StorageFolder.LIBRARY);
    const diskInfo = await this.storageRepository.checkDiskUsage(libraryBase);

    const usagePercentage = (((diskInfo.total - diskInfo.free) / diskInfo.total) * 100).toFixed(2);

    const serverInfo = new ServerInfoResponseDto();
    serverInfo.diskAvailable = asHumanReadable(diskInfo.available);
    serverInfo.diskSize = asHumanReadable(diskInfo.total);
    serverInfo.diskUse = asHumanReadable(diskInfo.total - diskInfo.free);
    serverInfo.diskAvailableRaw = diskInfo.available;
    serverInfo.diskSizeRaw = diskInfo.total;
    serverInfo.diskUseRaw = diskInfo.total - diskInfo.free;
    serverInfo.diskUsagePercentage = Number.parseFloat(usagePercentage);
    return serverInfo;
  }

  ping(): ServerPingResponse {
    return { res: 'pong' };
  }

  getVersion() {
    return serverVersion;
  }

  async getFeatures(): Promise<ServerFeaturesDto> {
    const { reverseGeocoding, map, machineLearning, trash, oauth, passwordLogin, notifications } =
      await this.configCore.getConfig();

    return {
      smartSearch: isSmartSearchEnabled(machineLearning),
      facialRecognition: isFacialRecognitionEnabled(machineLearning),
      map: map.enabled,
      reverseGeocoding: reverseGeocoding.enabled,
      sidecar: true,
      search: true,
      trash: trash.enabled,
      oauth: oauth.enabled,
      oauthAutoLaunch: oauth.autoLaunch,
      passwordLogin: passwordLogin.enabled,
      configFile: this.configCore.isUsingConfigFile(),
      email: notifications.smtp.enabled,
    };
  }

  async getTheme() {
    const { theme } = await this.configCore.getConfig();
    return theme;
  }

  async getConfig(): Promise<ServerConfigDto> {
    const config = await this.configCore.getConfig();
    const isInitialized = await this.userRepository.hasAdmin();
    const onboarding = await this.systemMetadataRepository.get(SystemMetadataKey.ADMIN_ONBOARDING);

    return {
      loginPageMessage: config.server.loginPageMessage,
      trashDays: config.trash.days,
      userDeleteDelay: config.user.deleteDelay,
      oauthButtonText: config.oauth.buttonText,
      isInitialized,
      isOnboarded: onboarding?.isOnboarded || false,
      externalDomain: config.server.externalDomain,
    };
  }

  async getStatistics(): Promise<ServerStatsResponseDto> {
    const userStats: UserStatsQueryResponse[] = await this.userRepository.getUserStats();
    const serverStats = new ServerStatsResponseDto();

    for (const user of userStats) {
      const usage = new UsageByUserDto();
      usage.userId = user.userId;
      usage.userName = user.userName;
      usage.photos = user.photos;
      usage.videos = user.videos;
      usage.usage = user.usage;
      usage.quotaSizeInBytes = user.quotaSizeInBytes;

      serverStats.photos += usage.photos;
      serverStats.videos += usage.videos;
      serverStats.usage += usage.usage;
      serverStats.usageByUser.push(usage);
    }

    return serverStats;
  }

  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return {
      video: Object.keys(mimeTypes.video),
      image: Object.keys(mimeTypes.image),
      sidecar: Object.keys(mimeTypes.sidecar),
    };
  }

  async handleVersionCheck(): Promise<boolean> {
    try {
      if (isDev) {
        return true;
      }

      const { newVersionCheck } = await this.configCore.getConfig();
      if (!newVersionCheck.enabled) {
        return true;
      }

      // check once per hour (max)
      if (this.releaseVersionCheckedAt && DateTime.now().diff(this.releaseVersionCheckedAt).as('minutes') < 60) {
        return true;
      }

      const githubRelease = await this.repository.getGitHubRelease();
      const githubVersion = Version.fromString(githubRelease.tag_name);
      const publishedAt = new Date(githubRelease.published_at);
      this.releaseVersion = githubVersion;
      this.releaseVersionCheckedAt = DateTime.now();

      if (githubVersion.isNewerThan(serverVersion)) {
        this.logger.log(`Found ${githubVersion.toString()}, released at ${publishedAt.toLocaleString()}`);
        this.newReleaseNotification();
      }
    } catch (error: Error | any) {
      this.logger.warn(`Unable to run version check: ${error}`, error?.stack);
    }

    return true;
  }

  @OnServerEvent(ServerEvent.WEBSOCKET_CONNECT)
  onWebsocketConnection({ userId }: ServerEventMap[ServerEvent.WEBSOCKET_CONNECT]) {
    this.eventRepository.clientSend(ClientEvent.SERVER_VERSION, userId, serverVersion);
    this.newReleaseNotification(userId);
  }

  private newReleaseNotification(userId?: string) {
    const event = ClientEvent.NEW_RELEASE;
    const payload = {
      isAvailable: this.releaseVersion.isNewerThan(serverVersion),
      checkedAt: this.releaseVersionCheckedAt,
      serverVersion,
      releaseVersion: this.releaseVersion,
    };

    userId
      ? this.eventRepository.clientSend(event, userId, payload)
      : this.eventRepository.clientBroadcast(event, payload);
  }
}
