import { UserEntity } from '@app/infra/entities';

export interface UserListFilter {
  withDeleted?: boolean;
}

export interface UserStatsQueryResponse {
  userId: string;
  userName: string;
  photos: number;
  videos: number;
  usage: number;
  quotaSizeInBytes: number | null;
}

export interface UserFindOptions {
  withDeleted?: boolean;
}

export const IUserRepository = 'IUserRepository';

export interface IUserRepository {
  get(id: string, options: UserFindOptions): Promise<UserEntity | null>;
  getAdmin(): Promise<UserEntity | null>;
  hasAdmin(): Promise<boolean>;
  getByEmail(email: string, withPassword?: boolean): Promise<UserEntity | null>;
  getByStorageLabel(storageLabel: string): Promise<UserEntity | null>;
  getByOAuthId(oauthId: string): Promise<UserEntity | null>;
  getDeletedUsers(): Promise<UserEntity[]>;
  getList(filter?: UserListFilter): Promise<UserEntity[]>;
  getUserStats(): Promise<UserStatsQueryResponse[]>;
  create(user: Partial<UserEntity>): Promise<UserEntity>;
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity>;
  delete(user: UserEntity, hard?: boolean): Promise<UserEntity>;
  updateUsage(id: string, delta: number): Promise<void>;
  syncUsage(id?: string): Promise<void>;
}
