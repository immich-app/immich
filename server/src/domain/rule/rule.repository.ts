import { RuleEntity } from '@app/infra/entities';

export const IRuleRepository = 'IRuleRepository';

export interface IRuleRepository {
  get(id: string): Promise<RuleEntity | null>;
  create(rule: Partial<RuleEntity>): Promise<RuleEntity>;
  update(rule: Partial<RuleEntity>): Promise<RuleEntity>;
  delete(rule: RuleEntity): Promise<RuleEntity>;
}
