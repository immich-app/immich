import { UserEntity } from 'src/entities/user.entity';
import { Permission } from 'src/enum';
import { ActivityRepository } from 'src/repositories/activity.repository';

export type AuthApiKey = {
  id: string;
  key: string;
  user: UserEntity;
  permissions: Permission[];
};

export type RepositoryInterface<T extends object> = Pick<T, keyof T>;

export type IActivityRepository = RepositoryInterface<ActivityRepository>;

export type ActivityItem =
  | Awaited<ReturnType<IActivityRepository['create']>>
  | Awaited<ReturnType<IActivityRepository['search']>>[0];
