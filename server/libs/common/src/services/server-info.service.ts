import { AssetType } from '@app/database/entities';
import { Inject, Injectable } from '@nestjs/common';
import diskusage from 'diskusage';
import { APP_UPLOAD_LOCATION } from '../constants';
import { asHumanReadable } from '../utils/human-readable.util';

export interface ServerDiskInfo {
  diskSize: string;
  diskUse: string;
  diskAvailable: string;
  diskSizeRaw: number;
  diskUseRaw: number;
  diskAvailableRaw: number;
  diskUsagePercentage: number;
}

export interface ServerUsageInfo {
  audio: number;
  other: number;
  photos: number;
  videos: number;
  objects: number;
  usageRaw: number;
  usage: string;
  usageByUser: ServerUserUsageInfo[];
}

export interface ServerUserUsageInfo {
  userId: string;
  videos: number;
  photos: number;
  audio: number;
  other: number;
  usageRaw: number;
  usage: string;
}

export type ServerUsageItems = ServerUsageItem[];
export interface ServerUsageItem {
  userId: string;
  assetType: AssetType;
  assetCount: number;
  totalSizeInBytes: number;
}

export const IAssetRepository = 'AssetRepository';

export interface IAssetRepository {
  getUserStats(): Promise<ServerUsageItems>;
}

@Injectable()
export class ServerInfoService {
  constructor(@Inject(IAssetRepository) private repository: IAssetRepository) {}

  public async getServerDiskInfo(): Promise<ServerDiskInfo> {
    const { total, free, available } = await diskusage.check(APP_UPLOAD_LOCATION);

    return {
      diskAvailable: asHumanReadable(available),
      diskSize: asHumanReadable(total),
      diskUse: asHumanReadable(total - free),
      diskAvailableRaw: available,
      diskSizeRaw: total,
      diskUseRaw: total - free,
      diskUsagePercentage: parseFloat((((total - free) / total) * 100).toFixed(2)),
    };
  }

  public async getServerUsageInfo(): Promise<ServerUsageInfo> {
    const stats: Record<string, ServerUserUsageInfo> = {};
    const items = await this.repository.getUserStats();

    for (const { assetType, userId, assetCount, totalSizeInBytes } of items) {
      if (!stats[userId]) {
        stats[userId] = {
          userId,
          videos: 0,
          photos: 0,
          audio: 0,
          other: 0,
          usageRaw: 0,
          usage: '',
        };
      }

      const userStats = stats[userId];
      switch (assetType) {
        case AssetType.AUDIO:
          userStats.audio += assetCount;
          break;

        case AssetType.IMAGE:
          userStats.photos += assetCount;
          break;

        case AssetType.VIDEO:
          userStats.videos += assetCount;
          break;

        case AssetType.OTHER:
          userStats.other += assetCount;
          break;
      }

      userStats.usageRaw += totalSizeInBytes;
    }

    const serverStats: ServerUsageInfo = {
      audio: 0,
      photos: 0,
      videos: 0,
      other: 0,
      objects: 0,
      usageRaw: 0,
      usage: '',
      usageByUser: [],
    };

    for (const stat of Object.values(stats)) {
      stat.usage = asHumanReadable(stat.usageRaw);

      const { photos, videos, audio, other, usageRaw } = stat;
      serverStats.audio += audio;
      serverStats.other += other;
      serverStats.photos += photos;
      serverStats.videos += videos;
      serverStats.usageRaw += usageRaw;
      serverStats.usageByUser.push(stat);
    }

    return serverStats;
  }
}
