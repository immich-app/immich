import { Inject, Injectable } from '@nestjs/common';
import { mimeTypes, serverVersion } from '../domain.constant';
import { asHumanReadable } from '../domain.util';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { ISystemConfigRepository, SystemConfigCore } from '../system-config';
import { IUserRepository, UserStatsQueryResponse } from '../user';
import {
  ServerConfigDto,
  ServerFeaturesDto,
  ServerInfoResponseDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  UsageByUserDto,
} from './server-info.dto';

@Injectable()
export class ServerInfoService {
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
    this.storageCore = new StorageCore(storageRepository);
  }

  async getInfo(): Promise<ServerInfoResponseDto> {
    const libraryBase = this.storageCore.getBaseFolder(StorageFolder.LIBRARY);
    const diskInfo = await this.storageRepository.checkDiskUsage(libraryBase);

    const usagePercentage = (((diskInfo.total - diskInfo.free) / diskInfo.total) * 100).toFixed(2);

    const serverInfo = new ServerInfoResponseDto();
    serverInfo.diskAvailable = asHumanReadable(diskInfo.available);
    serverInfo.diskSize = asHumanReadable(diskInfo.total);
    serverInfo.diskUse = asHumanReadable(diskInfo.total - diskInfo.free);
    serverInfo.diskAvailableRaw = diskInfo.available;
    serverInfo.diskSizeRaw = diskInfo.total;
    serverInfo.diskUseRaw = diskInfo.total - diskInfo.free;
    serverInfo.diskUsagePercentage = parseFloat(usagePercentage);
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

  async getConfig(): Promise<ServerConfigDto> {
    const config = await this.configCore.getConfig();

    // TODO move to system config
    const loginPageMessage = process.env.PUBLIC_LOGIN_PAGE_MESSAGE || '';

    return {
      loginPageMessage,
      mapTileUrl: config.map.tileUrl,
      trashDays: config.trash.days,
      oauthButtonText: config.oauth.buttonText,
    };
  }

  async getStats(): Promise<ServerStatsResponseDto> {
    const userStats: UserStatsQueryResponse[] = await this.userRepository.getUserStats();
    const serverStats = new ServerStatsResponseDto();

    for (const user of userStats) {
      const usage = new UsageByUserDto();
      usage.userId = user.userId;
      usage.userFirstName = user.userFirstName;
      usage.userLastName = user.userLastName;
      usage.photos = user.photos;
      usage.videos = user.videos;
      usage.usage = user.usage;

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
}
