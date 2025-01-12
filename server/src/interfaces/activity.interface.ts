import { Insertable } from 'kysely';
import { Activity } from 'src/db';
import { ActivityEntity } from 'src/entities/activity.entity';
import { ActivitySearch } from 'src/repositories/activity.repository';

export const IActivityRepository = 'IActivityRepository';

export interface IActivityRepository {
  search(options: ActivitySearch): Promise<ActivityEntity[]>;
  create(activity: Insertable<Activity>): Promise<ActivityEntity>;
  delete(id: string): Promise<void>;
  getStatistics(options: { albumId: string; assetId?: string }): Promise<number>;
}
