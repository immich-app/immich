import { RuleEntity, RuleKey } from '@app/infra/entities';
import { albumStub } from './album.stub';
import { userStub } from './user.stub';

export const ruleStub = {
  rule1: Object.freeze<RuleEntity>({
    id: 'rule-1',
    key: RuleKey.CITY,
    value: 'Chandler',
    owner: userStub.admin,
    ownerId: userStub.admin.id,
    album: albumStub.empty,
    albumId: albumStub.empty.id,
  }),
};
