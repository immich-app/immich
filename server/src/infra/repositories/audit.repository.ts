import { IAuditRepository } from '@app/domain/audit/audit.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEntity } from '../entities';

export class AuditRepository implements IAuditRepository {
  constructor(@InjectRepository(AuditEntity) private repository: Repository<AuditEntity>) {}

  get(): Promise<AuditEntity[]> {
    return this.repository.find();
  }
}
