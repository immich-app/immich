import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { OnEvent } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { mapPerson } from 'src/dtos/person.dto';
import { StatisticsResponseDto } from 'src/dtos/statistics.dto';
import { AssetType } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';

const STATISTICS_CACHE_TTL = 24 * 60 * 60; // seconds

@Injectable()
export class StatisticsService extends BaseService {
  private redisClient?: Redis;

  private get redis(): Redis {
    if (!this.redisClient) {
      const { redis } = this.configRepository.getEnv();
      this.redisClient = new Redis({ ...redis, lazyConnect: true });
      void this.redisClient.connect().catch((error) => {
        this.logger.warn(`Failed to connect to Redis for statistics caching: ${error}`);
      });
    }

    return this.redisClient;
  }

  private cacheKey(userId: string): string {
    return `statistics:${userId}`;
  }

  async getStatistics(auth: AuthDto): Promise<StatisticsResponseDto> {
    const userId = auth.user.id;
    const cacheKey = this.cacheKey(userId);

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as StatisticsResponseDto;
      }
    } catch (error) {
      this.logger.warn(`Failed to read statistics cache for user ${userId}: ${error}`);
    }

    const statistics = await this.buildStatistics(userId);

    try {
      await this.redis.setex(cacheKey, STATISTICS_CACHE_TTL, JSON.stringify(statistics));
    } catch (error) {
      this.logger.warn(`Failed to write statistics cache for user ${userId}: ${error}`);
    }

    return statistics;
  }

  private async buildStatistics(userId: string): Promise<StatisticsResponseDto> {
    const [monthly, temporalMatrix, people, cameras, lenses, cities, countries, storageByType] = await Promise.all([
      this.statisticsRepository.getMonthlyCounts(userId),
      this.statisticsRepository.getTemporalMatrix(userId),
      this.statisticsRepository.getTopPeople(userId),
      this.statisticsRepository.getTopCameras(userId),
      this.statisticsRepository.getTopLenses(userId),
      this.statisticsRepository.getTopCities(userId),
      this.statisticsRepository.getTopCountries(userId),
      this.statisticsRepository.getStorageByType(userId),
    ]);

    let photos = 0;
    let videos = 0;
    let storageBytes = 0;
    const storage: StatisticsResponseDto['storage'] = [];

    for (const row of storageByType) {
      const size = Number(row.size ?? 0);
      const count = Number(row.count);
      storageBytes += size;

      if (row.type === AssetType.Image) {
        photos = count;
        storage.push({ type: 'IMAGE', size, count });
      } else if (row.type === AssetType.Video) {
        videos = count;
        storage.push({ type: 'VIDEO', size, count });
      }
    }

    return {
      monthly: monthly.map((row) => ({ year: Number(row.year), month: Number(row.month), count: Number(row.count) })),
      temporalMatrix: temporalMatrix.map((row) => ({
        dayOfWeek: Number(row.dayOfWeek),
        hour: Number(row.hour),
        count: Number(row.count),
      })),
      topPeople: people.map((person) => ({ ...mapPerson(person), count: Number(person.count) })),
      topCameras: cameras.map((row) => ({ make: row.make, model: row.model, count: Number(row.count) })),
      topLenses: lenses.map((row) => ({ lensModel: row.lensModel, count: Number(row.count) })),
      topCities: cities.map((row) => ({ city: row.city, count: Number(row.count) })),
      topCountries: countries.map((row) => ({ country: row.country, count: Number(row.count) })),
      storage,
      total: { photos, videos, storage: storageBytes },
    };
  }

  private async invalidate(userId: string): Promise<void> {
    try {
      await this.redis.del(this.cacheKey(userId));
    } catch (error) {
      this.logger.warn(`Failed to invalidate statistics cache for user ${userId}: ${error}`);
    }
  }

  @OnEvent({ name: 'AssetCreate' })
  async onAssetCreate({ asset }: ArgOf<'AssetCreate'>): Promise<void> {
    await this.invalidate(asset.ownerId);
  }

  @OnEvent({ name: 'AssetMetadataExtracted' })
  async onAssetMetadataExtracted({ userId }: ArgOf<'AssetMetadataExtracted'>): Promise<void> {
    await this.invalidate(userId);
  }

  @OnEvent({ name: 'AssetDelete' })
  async onAssetDelete({ userId }: ArgOf<'AssetDelete'>): Promise<void> {
    await this.invalidate(userId);
  }

  @OnEvent({ name: 'AssetTrash' })
  async onAssetTrash({ userId }: ArgOf<'AssetTrash'>): Promise<void> {
    await this.invalidate(userId);
  }

  @OnEvent({ name: 'AssetTrashAll' })
  async onAssetTrashAll({ userId }: ArgOf<'AssetTrashAll'>): Promise<void> {
    await this.invalidate(userId);
  }

  @OnEvent({ name: 'AssetDeleteAll' })
  async onAssetDeleteAll({ userId }: ArgOf<'AssetDeleteAll'>): Promise<void> {
    await this.invalidate(userId);
  }

  @OnEvent({ name: 'AssetRestoreAll' })
  async onAssetRestoreAll({ userId }: ArgOf<'AssetRestoreAll'>): Promise<void> {
    await this.invalidate(userId);
  }
}
