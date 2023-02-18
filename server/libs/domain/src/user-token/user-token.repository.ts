import { UserTokenEntity } from '@app/infra/db/entities';

export const IUserTokenRepository = 'IUserTokenRepository';

export interface IUserTokenRepository {
  create(dto: Partial<UserTokenEntity>): Promise<UserTokenEntity>;
  delete(userToken: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  get(userToken: string): Promise<UserTokenEntity | null>;
}
