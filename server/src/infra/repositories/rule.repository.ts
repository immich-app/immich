import { IRuleRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleEntity } from '../entities';

export class RuleRepository implements IRuleRepository {
  constructor(@InjectRepository(RuleEntity) private assetRepository: Repository<RuleEntity>) {}

  create(rule: RuleEntity): Promise<RuleEntity> {
    return this.assetRepository.save(rule);
  }

  delete(rule: RuleEntity): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
