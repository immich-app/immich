import { Insertable, Updateable } from 'kysely';
import { Sessions } from 'src/db';
import { SessionEntity } from 'src/entities/session.entity';

export const ISessionRepository = 'ISessionRepository';

type E = SessionEntity;
export type SessionSearchOptions = { updatedBefore: Date };

export interface ISessionRepository {
  search(options: SessionSearchOptions): Promise<SessionEntity[]>;
  create(dto: Insertable<Sessions>): Promise<SessionEntity>;
  update(id: string, dto: Updateable<Sessions>): Promise<SessionEntity>;
  delete(id: string): Promise<void>;
  getByToken(token: string): Promise<E | undefined>;
  getByUserId(userId: string): Promise<E[]>;
}
