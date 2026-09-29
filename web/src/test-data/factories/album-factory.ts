import { faker } from '@faker-js/faker';
import { AssetOrder, type AlbumResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const albumFactory = Sync.makeFactory<AlbumResponseDto>({
  albumName: Sync.each(() => faker.commerce.product()),
  description: '',
  albumThumbnailAssetId: null,
  assetCount: Sync.each((index) => index % 5),
  createdAt: Sync.each(() => faker.date.past().toISOString()),
  updatedAt: Sync.each(() => faker.date.past().toISOString()),
  id: Sync.each(() => faker.string.uuid()),
  shared: false,
  albumUsers: [],
  hasSharedLink: false,
  isActivityEnabled: true,
  order: AssetOrder.Desc,
});
