import { faker } from '@faker-js/faker';
import { Color, type SharedSpaceResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const sharedSpaceFactory = Sync.makeFactory<SharedSpaceResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  name: Sync.each(() => faker.lorem.words(2)),
  description: null,
  createdById: Sync.each(() => faker.string.uuid()),
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  updatedAt: Sync.each(() => faker.date.past().toISOString()),
  color: Color.Primary,
  thumbnailAssetId: null,
  assetCount: Sync.each((i) => i * 10),
  memberCount: Sync.each((i) => (i % 5) + 1),
  members: [],
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  lastActivityAt: Sync.each(() => faker.date.recent().toISOString()),
  newAssetCount: 0,
  lastViewedAt: null,
});
