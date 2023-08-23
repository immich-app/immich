import { IAuditRepository } from '@app/domain/audit/audit.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { AuditEntity, EntityType } from '../entities/audit.entity';

export class AuditRepository implements IAuditRepository {
  constructor(@InjectRepository(AuditEntity) private repository: Repository<AuditEntity>) {}

  getAfter(ownerId: string, since: Date, type: EntityType): Promise<AuditEntity[]> {
    return this.repository
      .createQueryBuilder('audit')
      .where('"ownerId" = :ownerId', { ownerId })
      .andWhere('"time" >= :since', { since })
      .andWhere('"entityType" = :type', { type })
      .distinctOn(['audit.entityId', 'audit.entityType'])
      .orderBy('audit.entityId, audit.entityType, audit.time', 'DESC')
      .getMany();
  }

  countBefore(ownerId: string, time: Date, type: EntityType): Promise<number> {
    return this.repository.countBy({ entityType: type, ownerId: ownerId, createdAt: LessThanOrEqual(time) });
  }

  deleteBefore(before: Date): Promise<DeleteResult> {
    return this.repository.delete({ createdAt: LessThan(before) });
  }
}
