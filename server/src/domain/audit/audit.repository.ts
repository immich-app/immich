import { AuditEntity } from '@app/infra/entities';

export const IAuditRepository = 'IAuditRepository';

export interface IAuditRepository {
  get(): Promise<AuditEntity[]>;
}
