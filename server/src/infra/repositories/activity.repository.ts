import { IActivityRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntity } from '../entities/activity.entity';

@Injectable()
export class ActivityRepository implements IActivityRepository {
  constructor(@InjectRepository(ActivityEntity) private activityRepository: Repository<ActivityEntity>) {}

  getById(assetId: string, albumId: string): Promise<ActivityEntity[] | null> {
    return this.activityRepository.find({
      where: { assetId, albumId },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  getAlbumActivityById(albumId: string): Promise<ActivityEntity[] | null> {
    return this.activityRepository.find({
      where: { albumId },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  getStatistics(assetId: string, albumId: string): Promise<number> {
    return this.activityRepository.count({
      where: { assetId, albumId, isLiked: false },
      relations: {
        user: true,
      },
    });
  }

  getFavorite(albumId: string, userId: string, assetId?: string): Promise<ActivityEntity | null> {
    return this.activityRepository.findOne({
      where: { assetId, albumId, userId, isLiked: true },
      relations: {
        user: true,
      },
    });
  }

  getReactionById(id: string): Promise<ActivityEntity | null> {
    return this.activityRepository.findOneOrFail({
      where: { id },
      relations: {
        user: true,
      },
    });
  }

  async delete(entity: ActivityEntity) {
    await this.activityRepository.delete(entity.id);
  }

  async update(entity: Partial<ActivityEntity>): Promise<ActivityEntity> {
    const { id } = await this.activityRepository.save(entity);
    return this.activityRepository.findOneOrFail({
      where: { id },
      relations: {
        user: true,
      },
    });
  }
}
