import { ActivityEntity } from '@app/infra/entities/activity.entity';

export const IActivityRepository = 'IActivityRepository';

export interface IActivityRepository {
  update(entity: Partial<ActivityEntity>): Promise<ActivityEntity>;
  getById(assetId: string, albumId: string): Promise<ActivityEntity[] | null>;
  getFavorite(assetId: string, albumId: string, userId: string): Promise<ActivityEntity | null>;
  delete(entity: ActivityEntity): void;
  getReactionById(id: string): Promise<ActivityEntity | null>;
  getStatistics(assetId: string, albumId: string): Promise<number>;
}
