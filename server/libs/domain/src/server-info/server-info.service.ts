import { Inject, Injectable } from '@nestjs/common';
import { serverVersion } from '../domain.constant';
import { asHumanReadable } from '../domain.util';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { IUserRepository, UserStatsQueryResponse } from '../user';
import { ServerInfoResponseDto, ServerPingResponse, ServerStatsResponseDto, UsageByUserDto } from './response-dto';

@Injectable()
export class ServerInfoService {
  private storageCore = new StorageCore();

  constructor(
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {}

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
    return new ServerPingResponse('pong');
  }

  getVersion() {
    return serverVersion;
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
}
