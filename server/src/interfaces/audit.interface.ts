import { DatabaseAction, EntityType } from 'src/entities/audit.entity';

export const IAuditRepository = 'IAuditRepository';

export interface AuditSearch {
  action?: DatabaseAction;
  entityType?: EntityType;
  userIds: string[];
}

export interface IAuditRepository {
  getAfter(since: Date, options: AuditSearch): Promise<string[]>;
  removeBefore(before: Date): Promise<void>;
}
