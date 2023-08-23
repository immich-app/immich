import { AuditEntity, EntityType } from '@app/infra/entities';
import { DeleteResult } from 'typeorm';

export const IAuditRepository = 'IAuditRepository';

export interface IAuditRepository {
  getAfter(ownerId: string, since: Date, type: EntityType): Promise<AuditEntity[]>;
  countBefore(ownerId: string, time: Date, type: EntityType): Promise<number>;
  deleteBefore(before: Date): Promise<DeleteResult>;
}
