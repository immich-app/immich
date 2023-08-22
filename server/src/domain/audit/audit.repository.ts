import { AuditEntity } from '@app/infra/entities';
import { DeleteResult } from 'typeorm';

export const IAuditRepository = 'IAuditRepository';

export interface IAuditRepository {
  getNewestForOwnerSince(ownerId: string, since: Date): Promise<AuditEntity[]>;
  countOlderForOwner(ownerId: string, time: Date): Promise<number>;
  cleanOldEntries(before: Date): Promise<DeleteResult>;
}
