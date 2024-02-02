import type { AlbumResponseDto } from '@api';
import { faker } from '@faker-js/faker';
import { Sync } from 'factory.ts';
import { userFactory } from './user-factory';

export const albumFactory = Sync.makeFactory<AlbumResponseDto>({
  albumName: Sync.each(() => faker.commerce.product()),
  description: '',
  albumThumbnailAssetId: null,
  assetCount: Sync.each((index) => index % 5),
  assets: [],
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  updatedAt: Sync.each(() => faker.date.past().toISOString()),
  id: Sync.each(() => faker.string.uuid()),
  ownerId: Sync.each(() => faker.string.uuid()),
  owner: userFactory.build(),
  shared: false,
  sharedUsers: [],
  hasSharedLink: false,
  isActivityEnabled: true,
});
