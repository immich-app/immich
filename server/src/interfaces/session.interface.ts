import { SessionEntity } from 'src/entities/session.entity';

export const ISessionRepository = 'ISessionRepository';

export interface ISessionRepository {
  create(dto: Partial<SessionEntity>): Promise<SessionEntity>;
  update(dto: Partial<SessionEntity>): Promise<SessionEntity>;
  delete(id: string): Promise<void>;
  getByToken(token: string): Promise<SessionEntity | null>;
  getByUserId(userId: string): Promise<SessionEntity[]>;
}
