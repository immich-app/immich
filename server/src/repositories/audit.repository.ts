import { InjectRepository } from '@nestjs/typeorm';
import { AuditEntity } from 'src/entities/audit.entity';
import { AuditSearch, IAuditRepository } from 'src/interfaces/audit.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { LessThan, MoreThan, Repository } from 'typeorm';

@Instrumentation()
export class AuditRepository implements IAuditRepository {
  constructor(@InjectRepository(AuditEntity) private repository: Repository<AuditEntity>) {}

  getAfter(since: Date, options: AuditSearch): Promise<AuditEntity[]> {
    return this.repository
      .createQueryBuilder('audit')
      .where({
        createdAt: MoreThan(since),
        action: options.action,
        entityType: options.entityType,
        ownerId: options.ownerId,
      })
      .distinctOn(['audit.entityId', 'audit.entityType'])
      .orderBy('audit.entityId, audit.entityType, audit.createdAt', 'DESC')
      .getMany();
  }

  async removeBefore(before: Date): Promise<void> {
    await this.repository.delete({ createdAt: LessThan(before) });
  }
}
