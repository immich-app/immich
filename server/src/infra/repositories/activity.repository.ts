import { IActivityRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntity } from '../entities/activity.entity';

export interface ActivitySearch {
  albumId?: string;
  assetId?: string;
  userId?: string;
  isLiked?: boolean;
}

@Injectable()
export class ActivityRepository implements IActivityRepository {
  constructor(@InjectRepository(ActivityEntity) private repository: Repository<ActivityEntity>) {}

  search(options: ActivitySearch): Promise<ActivityEntity[]> {
    const { assetId, albumId, userId, isLiked } = options;
    return this.repository.find({
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

  get(id: string): Promise<ActivityEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async create(activity: Partial<ActivityEntity>): Promise<ActivityEntity> {
    const reaction = await this.repository.save(activity);
    return this.repository.findOneOrFail({
      where: {
        id: reaction.id,
      },
      relations: {
        user: true,
      },
    });
  }

  async update(entity: Partial<ActivityEntity>): Promise<ActivityEntity> {
    const { id } = await this.repository.save(entity);
    return this.repository.findOneOrFail({
      where: {
        id,
      },
      relations: {
        user: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  getStatistics(assetId: string, albumId: string): Promise<number> {
    return this.repository.count({
      where: { assetId, albumId, isLiked: false },
      relations: {
        user: true,
      },
    });
  }
}
