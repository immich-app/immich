import { SessionEntity } from 'src/entities/session.entity';

export const ISessionRepository = 'ISessionRepository';

type E = SessionEntity;
export type SessionSearchOptions = { updatedBefore: Date };

export interface ISessionRepository {
  search(options: SessionSearchOptions): Promise<SessionEntity[]>;
  create<T extends Partial<E>>(dto: T): Promise<T>;
  update<T extends Partial<E>>(dto: T): Promise<T>;
  delete(id: string): Promise<void>;
  getByToken(token: string): Promise<E | null>;
  getByUserId(userId: string): Promise<E[]>;
}
