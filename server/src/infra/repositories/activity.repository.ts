import { IActivityRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntity } from '../entities/activity.entity';

export interface ActivitySearch {
  id?: string;
  albumId?: string;
  assetId?: string;
  userId?: string;
  isLiked?: boolean;
}

@Injectable()
export class ActivityRepository implements IActivityRepository {
  constructor(@InjectRepository(ActivityEntity) private activityRepository: Repository<ActivityEntity>) {}

  get(id: string): Promise<ActivityEntity> {
    return this.activityRepository.findOneOrFail({
      where: { id },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  search(options: ActivitySearch): Promise<ActivityEntity[]> {
    const { assetId, albumId, userId, isLiked } = options;
    return this.activityRepository.find({
      where: {
        assetId,
        albumId,
        userId,
        isLiked,
      },
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

  async delete(entity: ActivityEntity) {
    await this.activityRepository.delete(entity.id);
  }
  async create(activity: Partial<ActivityEntity>): Promise<ActivityEntity> {
    return await this.activityRepository.save(activity);
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
