import { RuleEntity } from '@app/infra/entities';

export const IRuleRepository = 'IRuleRepository';

export interface IRuleRepository {
  create(rule: RuleEntity): Promise<RuleEntity>;
  delete(rule: RuleEntity): Promise<RuleEntity>;
}
