import { ActivityEntity } from '@app/infra/entities/activity.entity';
import { ActivitySearch } from '@app/infra/repositories';

export const IActivityRepository = 'IActivityRepository';

export interface IActivityRepository {
  update(entity: Partial<ActivityEntity>): Promise<ActivityEntity>;
  get(id: string): Promise<ActivityEntity>;
  create(activity: Partial<ActivityEntity>): Promise<ActivityEntity>;
  delete(entity: ActivityEntity): void;
  search(options: ActivitySearch): Promise<ActivityEntity[]>;
  getStatistics(assetId: string | undefined, albumId: string): Promise<number>;
}
