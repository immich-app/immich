import { faker } from '@faker-js/faker';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
import { Sync } from 'factory.ts';

export const assetFactory = Sync.makeFactory<AssetResponseDto>({
  id: Sync.each(() => faker.string.uuid()),
  deviceAssetId: Sync.each(() => faker.string.uuid()),
  ownerId: Sync.each(() => faker.string.uuid()),
  deviceId: '',
  libraryId: Sync.each(() => faker.string.uuid()),
  type: Sync.each(() => faker.helpers.enumValue(AssetTypeEnum)),
  originalPath: Sync.each(() => faker.system.filePath()),
  originalFileName: Sync.each(() => faker.system.fileName()),
  originalMimeType: Sync.each(() => faker.system.mimeType()),
  thumbhash: Sync.each(() => faker.string.alphanumeric(28)),
  fileCreatedAt: Sync.each(() => faker.date.past().toISOString()),
  fileModifiedAt: Sync.each(() => faker.date.past().toISOString()),
  localDateTime: Sync.each(() => faker.date.past().toISOString()),
  updatedAt: Sync.each(() => faker.date.past().toISOString()),
  isFavorite: Sync.each(() => faker.datatype.boolean()),
  isArchived: false,
  isTrashed: false,
  duration: '0:00:00.00000',
  checksum: Sync.each(() => faker.string.alphanumeric(28)),
  isOffline: Sync.each(() => faker.datatype.boolean()),
  hasMetadata: Sync.each(() => faker.datatype.boolean()),
});
