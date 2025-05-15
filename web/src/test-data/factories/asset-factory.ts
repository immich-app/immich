import type { TimelineAsset } from '$lib/stores/assets-store.svelte';
import { faker } from '@faker-js/faker';
import { AssetTypeEnum, Visibility, type AssetResponseDto } from '@immich/sdk';
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
  visibility: Visibility.Timeline,
});

export const timelineAssetFactory = Sync.makeFactory<TimelineAsset>({
  id: Sync.each(() => faker.string.uuid()),
  ratio: Sync.each(() => faker.number.int()),
  ownerId: Sync.each(() => faker.string.uuid()),
  thumbhash: Sync.each(() => faker.string.alphanumeric(28)),
  localDateTime: Sync.each(() => faker.date.past().toISOString()),
  isFavorite: Sync.each(() => faker.datatype.boolean()),
  isArchived: false,
  isTrashed: false,
  isImage: true,
  isVideo: false,
  duration: '0:00:00.00000',
  stack: null,
  projectionType: null,
  livePhotoVideoId: Sync.each(() => faker.string.uuid()),
  text: Sync.each(() => ({
    city: faker.location.city(),
    country: faker.location.country(),
    people: [faker.person.fullName()],
  })),
});
