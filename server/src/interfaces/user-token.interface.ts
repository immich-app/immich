import { UserTokenEntity } from 'src/entities/user-token.entity';

export const IUserTokenRepository = 'IUserTokenRepository';

export interface IUserTokenRepository {
  create(dto: Partial<UserTokenEntity>): Promise<UserTokenEntity>;
  save(dto: Partial<UserTokenEntity>): Promise<UserTokenEntity>;
  delete(id: string): Promise<void>;
  getByToken(token: string): Promise<UserTokenEntity | null>;
  getAll(userId: string): Promise<UserTokenEntity[]>;
}
