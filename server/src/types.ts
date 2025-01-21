import { UserEntity } from 'src/entities/user.entity';
import { Permission } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { ViewRepository } from 'src/repositories/view-repository';

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type AuthApiKey = {
  id: string;
  key: string;
  user: UserEntity;
  permissions: Permission[];
};

export type RepositoryInterface<T extends object> = Pick<T, keyof T>;

export type IActivityRepository = RepositoryInterface<ActivityRepository>;
export type IAccessRepository = { [K in keyof AccessRepository]: RepositoryInterface<AccessRepository[K]> };
export type IApiKeyRepository = RepositoryInterface<ApiKeyRepository>;
export type IAuditRepository = RepositoryInterface<AuditRepository>;
export type IConfigRepository = RepositoryInterface<ConfigRepository>;
export type IViewRepository = RepositoryInterface<ViewRepository>;

export type ActivityItem =
  | Awaited<ReturnType<IActivityRepository['create']>>
  | Awaited<ReturnType<IActivityRepository['search']>>[0];

export type ApiKeyItem =
  | Awaited<ReturnType<IApiKeyRepository['create']>>
  | NonNullable<Awaited<ReturnType<IApiKeyRepository['getById']>>>
  | Awaited<ReturnType<IApiKeyRepository['getByUserId']>>[0];
