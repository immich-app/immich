import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditEntity } from 'src/entities/audit.entity';
import { AuditSearch, IAuditRepository } from 'src/interfaces/audit.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { In, LessThan, MoreThan, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AuditRepository implements IAuditRepository {
  constructor(@InjectRepository(AuditEntity) private repository: Repository<AuditEntity>) {}

  getAfter(since: Date, options: AuditSearch): Promise<string[]> {
    return this.repository
      .createQueryBuilder('audit')
      .where({
        createdAt: MoreThan(since),
        action: options.action,
        entityType: options.entityType,
        ownerId: In(options.userIds),
      })
      .distinctOn(['audit.entityId', 'audit.entityType'])
      .orderBy('audit.entityId, audit.entityType, audit.createdAt', 'DESC')
      .select('audit.entityId')
      .getRawMany();
  }

  async removeBefore(before: Date): Promise<void> {
    await this.repository.delete({ createdAt: LessThan(before) });
  }
}
