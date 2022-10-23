import { APP_UPLOAD_LOCATION } from '@app/common/constants';
import { Injectable } from '@nestjs/common';
import { ServerInfoResponseDto } from './response-dto/server-info-response.dto';
import diskusage from 'diskusage';
import { ServerStatsResponseDto } from './response-dto/server-stats-response.dto';
import { UsageByUserDto } from './response-dto/usage-by-user-response.dto';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import path from 'path';
import { readdirSync, statSync } from 'fs';

@Injectable()
export class ServerInfoService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  async getServerInfo(): Promise<ServerInfoResponseDto> {
    const diskInfo = await diskusage.check(APP_UPLOAD_LOCATION);

    const usagePercentage = (((diskInfo.total - diskInfo.free) / diskInfo.total) * 100).toFixed(2);

    const serverInfo = new ServerInfoResponseDto();
    serverInfo.diskAvailable = ServerInfoService.getHumanReadableString(diskInfo.available);
    serverInfo.diskSize = ServerInfoService.getHumanReadableString(diskInfo.total);
    serverInfo.diskUse = ServerInfoService.getHumanReadableString(diskInfo.total - diskInfo.free);
    serverInfo.diskAvailableRaw = diskInfo.available;
    serverInfo.diskSizeRaw = diskInfo.total;
    serverInfo.diskUseRaw = diskInfo.total - diskInfo.free;
    serverInfo.diskUsagePercentage = parseFloat(usagePercentage);
    return serverInfo;
  }

  private static getHumanReadableString(sizeInByte: number) {
    const pepibyte = 1.126 * Math.pow(10, 15);
    const tebibyte = 1.1 * Math.pow(10, 12);
    const gibibyte = 1.074 * Math.pow(10, 9);
    const mebibyte = 1.049 * Math.pow(10, 6);
    const kibibyte = 1024;
    // Pebibyte
    if (sizeInByte >= pepibyte) {
      // Pe
      return `${(sizeInByte / pepibyte).toFixed(1)}PB`;
    } else if (tebibyte <= sizeInByte && sizeInByte < pepibyte) {
      // Te
      return `${(sizeInByte / tebibyte).toFixed(1)}TB`;
    } else if (gibibyte <= sizeInByte && sizeInByte < tebibyte) {
      // Gi
      return `${(sizeInByte / gibibyte).toFixed(1)}GB`;
    } else if (mebibyte <= sizeInByte && sizeInByte < gibibyte) {
      // Mega
      return `${(sizeInByte / mebibyte).toFixed(1)}MB`;
    } else if (kibibyte <= sizeInByte && sizeInByte < mebibyte) {
      // Kibi
      return `${(sizeInByte / kibibyte).toFixed(1)}KB`;
    } else {
      return `${sizeInByte}B`;
    }
  }

  async getStats(): Promise<ServerStatsResponseDto> {
    const res = await this.assetRepository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)`, 'count')
      .addSelect(`asset.type`, 'type')
      .addSelect(`asset.userId`, 'userId')
      .groupBy('asset.type, asset.userId')
      .addGroupBy('asset.type')
      .getRawMany();

    const serverStats = new ServerStatsResponseDto();
    const tmpMap = new Map<string, UsageByUserDto>();
    const getUsageByUser = (id: string) => tmpMap.get(id) || new UsageByUserDto(id);
    res.map((item) => {
      const usage: UsageByUserDto = getUsageByUser(item.userId);
      if (item.type === 'IMAGE') {
        usage.photos = parseInt(item.count);
        serverStats.photos += usage.photos;
      } else if (item.type === 'VIDEO') {
        usage.videos = parseInt(item.count);
        serverStats.videos += usage.videos;
      }
      tmpMap.set(item.userId, usage);
    });

    for (const userId of tmpMap.keys()) {
      const usage = getUsageByUser(userId);
      const userDiskUsage = await ServerInfoService.getDirectoryStats(path.join(APP_UPLOAD_LOCATION, userId));
      usage.usageRaw = userDiskUsage.size;
      usage.objects = userDiskUsage.fileCount;
      usage.usage = ServerInfoService.getHumanReadableString(usage.usageRaw);
      serverStats.usageRaw += usage.usageRaw;
      serverStats.objects += usage.objects;
    }
    serverStats.usage = ServerInfoService.getHumanReadableString(serverStats.usageRaw);
    serverStats.usageByUser = Array.from(tmpMap.values());
    return serverStats;
  }

  private static async getDirectoryStats(dirPath: string) {
    let size = 0;
    let fileCount = 0;
    for (const filename of readdirSync(dirPath)) {
      const absFilename = path.join(dirPath, filename);
      const fileStat = statSync(absFilename);
      if (fileStat.isFile()) {
        size += fileStat.size;
        fileCount += 1;
      } else if (fileStat.isDirectory()) {
        const subDirStat = await ServerInfoService.getDirectoryStats(absFilename);
        size += subDirStat.size;
        fileCount += subDirStat.fileCount;
      }
    }
    return { size, fileCount };
  }
}
