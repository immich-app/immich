import { IRuleRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleEntity } from '../entities';

export class RuleRepository implements IRuleRepository {
  constructor(@InjectRepository(RuleEntity) private repository: Repository<RuleEntity>) {}

  create(rule: RuleEntity): Promise<RuleEntity> {
    return this.repository.save(rule);
  }

  delete(rule: RuleEntity): Promise<RuleEntity> {
    return this.repository.remove(rule);
  }
}
