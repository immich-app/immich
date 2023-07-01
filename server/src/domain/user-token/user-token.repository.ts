import { UserTokenEntity } from '@app/infra/entities/index.js';

export const IUserTokenRepository = 'IUserTokenRepository';

export interface IUserTokenRepository {
  create(dto: Partial<UserTokenEntity>): Promise<UserTokenEntity>;
  save(dto: Partial<UserTokenEntity>): Promise<UserTokenEntity>;
  delete(userId: string, id: string): Promise<void>;
  getByToken(token: string): Promise<UserTokenEntity | null>;
  getAll(userId: string): Promise<UserTokenEntity[]>;
}
