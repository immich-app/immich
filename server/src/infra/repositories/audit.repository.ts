import { IAuditRepository } from '@app/domain/audit/audit.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { AuditEntity } from '../entities';

export class AuditRepository implements IAuditRepository {
  constructor(@InjectRepository(AuditEntity) private repository: Repository<AuditEntity>) {}

  getNewestForOwnerSince(ownerId: string, since: Date): Promise<AuditEntity[]> {
    return this.repository
      .createQueryBuilder('audit')
      .where('"ownerId" = :ownerId', { ownerId })
      .andWhere('"time" >= :since', { since })
      .distinctOn(['audit.entityId', 'audit.entityType'])
      .orderBy('audit.entityId, audit.entityType, audit.time', 'DESC')
      .getMany();
  }

  countOlderForOwner(ownerId: string, time: Date): Promise<number> {
    return this.repository.countBy({ ownerId: ownerId, time: LessThanOrEqual(time) });
  }
}
