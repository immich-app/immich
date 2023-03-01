import { APP_UPLOAD_LOCATION } from '@app/common/constants';
import { Injectable } from '@nestjs/common';
import { ServerInfoResponseDto } from './response-dto/server-info-response.dto';
import diskusage from 'diskusage';
import { ServerStatsResponseDto } from './response-dto/server-stats-response.dto';
import { UsageByUserDto } from './response-dto/usage-by-user-response.dto';
import { UserEntity } from '@app/infra';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { asHumanReadable } from '../../utils/human-readable.util';

@Injectable()
export class ServerInfoService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
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
    type UserStatsQueryResponse = {
      userId: string;
      userFirstName: string;
      userLastName: string;
      photos: string;
      videos: string;
      usage: string;
    };

    const userStatsQueryResponse: UserStatsQueryResponse[] = await this.userRepository
      .createQueryBuilder('users')
      .select('users.id', 'userId')
      .addSelect('users.firstName', 'userFirstName')
      .addSelect('users.lastName', 'userLastName')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'IMAGE' AND assets.isVisible)`, 'photos')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'VIDEO' AND assets.isVisible)`, 'videos')
      .addSelect('COALESCE(SUM(exif.fileSizeInByte), 0)', 'usage')
      .leftJoin('users.assets', 'assets')
      .leftJoin('assets.exifInfo', 'exif')
      .groupBy('users.id')
      .orderBy('users.createdAt', 'ASC')
      .getRawMany();

    const usageByUser = userStatsQueryResponse.map((userStats) => {
      const usage = new UsageByUserDto();
      usage.userId = userStats.userId;
      usage.userFirstName = userStats.userFirstName;
      usage.userLastName = userStats.userLastName;
      usage.photos = Number(userStats.photos);
      usage.videos = Number(userStats.videos);
      usage.usage = Number(userStats.usage);

      return usage;
    });

    const serverStats = new ServerStatsResponseDto();
    usageByUser.forEach((user) => {
      serverStats.photos += user.photos;
      serverStats.videos += user.videos;
      serverStats.usage += user.usage;
    });
    serverStats.usageByUser = usageByUser;

    return serverStats;
  }
}
