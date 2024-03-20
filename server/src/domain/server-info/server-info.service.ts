import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Version, isDev, mimeTypes, serverVersion } from 'src/domain/domain.constant';
import { asHumanReadable } from 'src/domain/domain.util';
import { ClientEvent, ICommunicationRepository } from 'src/domain/repositories/communication.repository';
import { IServerInfoRepository } from 'src/domain/repositories/server-info.repository';
import { IStorageRepository } from 'src/domain/repositories/storage.repository';
import { ISystemConfigRepository } from 'src/domain/repositories/system-config.repository';
import { ISystemMetadataRepository } from 'src/domain/repositories/system-metadata.repository';
import { IUserRepository, UserStatsQueryResponse } from 'src/domain/repositories/user.repository';
import {
  ServerConfigDto,
  ServerFeaturesDto,
  ServerInfoResponseDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  UsageByUserDto,
} from 'src/domain/server-info/server-info.dto';
import { StorageCore, StorageFolder } from 'src/domain/storage/storage.core';
import { SystemConfigCore } from 'src/domain/system-config/system-config.core';
import { SystemMetadataKey } from 'src/infra/entities/system-metadata.entity';
import { ImmichLogger } from 'src/infra/logger';

@Injectable()
export class ServerInfoService {
  private logger = new ImmichLogger(ServerInfoService.name);
  private configCore: SystemConfigCore;
  private releaseVersion = serverVersion;
  private releaseVersionCheckedAt: DateTime | null = null;

  constructor(
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IServerInfoRepository) private repository: IServerInfoRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) private readonly systemMetadataRepository: ISystemMetadataRepository,
  ) {
    this.configCore = SystemConfigCore.create(configRepository);
    this.communicationRepository.on('connect', (userId) => this.handleConnect(userId));
  }

  async init(): Promise<void> {
    await this.handleVersionCheck();

    const featureFlags = await this.getFeatures();
    if (featureFlags.configFile) {
      await this.setAdminOnboarding();
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

  getFeatures(): Promise<ServerFeaturesDto> {
    return this.configCore.getFeatures();
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

  setAdminOnboarding(): Promise<void> {
    return this.systemMetadataRepository.set(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: true });
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

  private handleConnect(userId: string) {
    this.communicationRepository.send(ClientEvent.SERVER_VERSION, userId, serverVersion);
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
      ? this.communicationRepository.send(event, userId, payload)
      : this.communicationRepository.broadcast(event, payload);
  }
}
