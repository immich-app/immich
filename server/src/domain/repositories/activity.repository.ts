import { ActivityEntity } from '@app/infra/entities/activity.entity';

export const IActivityRepository = 'IActivityRepository';

export interface IActivityRepository {
  update(entity: Partial<ActivityEntity>): Promise<ActivityEntity>;
  getById(assetId: string, albumId: string): Promise<ActivityEntity[] | null>;
  getAlbumActivityById(albumId: string): Promise<ActivityEntity[] | null>;
  getFavorite(albumId: string, userId: string, assetId?: string): Promise<ActivityEntity | null>;
  delete(entity: ActivityEntity): void;
  getReactionById(id: string): Promise<ActivityEntity | null>;
  getStatistics(assetId: string | undefined, albumId: string): Promise<number>;
}
