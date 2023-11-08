import { ActivityEntity } from '@app/infra/entities/activity.entity';
import { ActivitySearch } from '@app/infra/repositories';

export const IActivityRepository = 'IActivityRepository';

export interface IActivityRepository {
  search(options: ActivitySearch): Promise<ActivityEntity[]>;
  create(activity: Partial<ActivityEntity>): Promise<ActivityEntity>;
  delete(id: string): Promise<void>;
  getStatistics(assetId: string | undefined, albumId: string): Promise<number>;
}
