import { APP_UPLOAD_LOCATION } from '@app/common/constants';
import { Injectable } from '@nestjs/common';
import { ServerInfoResponseDto } from './response-dto/server-info-response.dto';
import diskusage from 'diskusage';
import { ServerStatsResponseDto } from './response-dto/server-stats-response.dto';
import { UsageByUserDto } from './response-dto/usage-by-user-response.dto';
import { AssetEntity } from '@app/database';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { asHumanReadable } from '../../utils/human-readable.util';

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
    serverInfo.diskAvailable = asHumanReadable(diskInfo.available);
    serverInfo.diskSize = asHumanReadable(diskInfo.total);
    serverInfo.diskUse = asHumanReadable(diskInfo.total - diskInfo.free);
    serverInfo.diskAvailableRaw = diskInfo.available;
    serverInfo.diskSizeRaw = diskInfo.total;
    serverInfo.diskUseRaw = diskInfo.total - diskInfo.free;
    serverInfo.diskUsagePercentage = parseFloat(usagePercentage);
    return serverInfo;
  }

  async getStats(): Promise<ServerStatsResponseDto> {
    const serverStats = new ServerStatsResponseDto();

    type UserStatsQueryResponse = {
      assetType: string;
      assetCount: string;
      totalSizeInBytes: string;
      userId: string;
    };

    const userStatsQueryResponse: UserStatsQueryResponse[] = await this.assetRepository
      .createQueryBuilder('a')
      .select('COUNT(a.id)', 'assetCount')
      .addSelect('SUM(ei.fileSizeInByte)', 'totalSizeInBytes')
      .addSelect('a."userId"')
      .addSelect('a.type', 'assetType')
      .where('a.isVisible = true')
      .leftJoin('a.exifInfo', 'ei')
      .groupBy('a."userId"')
      .addGroupBy('a.type')
      .getRawMany();

    const tmpMap = new Map<string, UsageByUserDto>();
    const getUsageByUser = (id: string) => tmpMap.get(id) || new UsageByUserDto(id);

    userStatsQueryResponse.forEach((r) => {
      const usageByUser = getUsageByUser(r.userId);
      usageByUser.photos += r.assetType === 'IMAGE' ? parseInt(r.assetCount) : 0;
      usageByUser.videos += r.assetType === 'VIDEO' ? parseInt(r.assetCount) : 0;
      usageByUser.usageRaw += parseInt(r.totalSizeInBytes);
      usageByUser.usage = asHumanReadable(usageByUser.usageRaw);

      serverStats.photos += r.assetType === 'IMAGE' ? parseInt(r.assetCount) : 0;
      serverStats.videos += r.assetType === 'VIDEO' ? parseInt(r.assetCount) : 0;
      serverStats.usageRaw += parseInt(r.totalSizeInBytes);
      serverStats.usage = asHumanReadable(serverStats.usageRaw);
      tmpMap.set(r.userId, usageByUser);
    });

    serverStats.usageByUser = Array.from(tmpMap.values());

    return serverStats;
  }
}
