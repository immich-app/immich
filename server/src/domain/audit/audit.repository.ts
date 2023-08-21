import { AuditEntity } from '@app/infra/entities';

export const IAuditRepository = 'IAuditRepository';

export interface IAuditRepository {
  getNewestForOwnerSince(ownerId: string, since: Date): Promise<AuditEntity[]>;
  countOlderForOwner(ownerId: string, time: Date): Promise<number>;
}
