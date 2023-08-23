import { IRuleRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleEntity } from '../entities';

export class RuleRepository implements IRuleRepository {
  constructor(@InjectRepository(RuleEntity) private repository: Repository<RuleEntity>) {}

  get(id: string): Promise<RuleEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  create(rule: Partial<RuleEntity>): Promise<RuleEntity> {
    return this.save(rule);
  }

  update(rule: Partial<RuleEntity>): Promise<RuleEntity> {
    return this.save(rule);
  }

  delete(rule: RuleEntity): Promise<RuleEntity> {
    return this.repository.remove(rule);
  }

  private async save(rule: Partial<RuleEntity>): Promise<RuleEntity> {
    await this.repository.save(rule);
    return this.repository.findOneOrFail({ where: { id: rule.id } });
  }
}
