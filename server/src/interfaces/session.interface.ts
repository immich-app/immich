import { SessionEntity } from 'src/entities/session.entity';

export const ISessionRepository = 'ISessionRepository';

type E = SessionEntity;

export interface ISessionRepository {
  create<T extends Partial<E>>(dto: T): Promise<T>;
  update<T extends Partial<E>>(dto: T): Promise<T>;
  delete(id: string): Promise<void>;
  getByToken(token: string): Promise<E | null>;
  getByUserId(userId: string): Promise<E[]>;
}
