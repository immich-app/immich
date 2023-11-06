import { IActivityRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ActivityEntity } from '../entities/activity.entity';

export interface ActivitySearch {
  albumId?: string;
  assetId?: string;
  userId?: string;
  isLiked?: boolean;
  isGlobal?: boolean;
}

@Injectable()
export class ActivityRepository implements IActivityRepository {
  constructor(@InjectRepository(ActivityEntity) private repository: Repository<ActivityEntity>) {}

  search(options: ActivitySearch): Promise<ActivityEntity[]> {
    const { userId, assetId, albumId, isLiked, isGlobal } = options;
    return this.repository.find({
      where: {
        userId,
        assetId: isGlobal ? IsNull() : assetId,
        albumId,
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

  create(entity: Partial<ActivityEntity>): Promise<ActivityEntity> {
    return this.save(entity);
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

  private async save(entity: Partial<ActivityEntity>) {
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
}
