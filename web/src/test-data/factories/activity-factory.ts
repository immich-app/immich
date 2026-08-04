import { faker } from '@faker-js/faker';
import { ReactionType, type ActivityResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';
import { userFactory } from '@test-data/factories/user-factory';

export const activityFactory = Sync.makeFactory<ActivityResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  assetId: Sync.each(() => faker.string.uuid()),
  assetType: null,
  comment: null,
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  groupId: null,
  type: ReactionType.Comment,
  user: Sync.each(() => userFactory.build()),
});
