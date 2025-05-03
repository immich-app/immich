import type { TimelineAsset } from '$lib/stores/assets-store.svelte';
import { faker } from '@faker-js/faker';
import {
  AssetTypeEnum,
  type AssetResponseDto,
  type TimeBucketAssetResponseDto,
  type TimeBucketResponseDto,
  type TimelineStackResponseDto,
} from '@immich/sdk';
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
  description: Sync.each(() => ({
    city: faker.location.city(),
    country: faker.location.country(),
    people: [faker.person.fullName()],
  })),
});

export const toResponseDto = (...timelineAsset: TimelineAsset[]) => {
  const bucketAssets: TimeBucketAssetResponseDto = {
    description: [],
    duration: [],
    id: [],
    isArchived: [],
    isFavorite: [],
    isImage: [],
    isTrashed: [],
    isVideo: [],
    livePhotoVideoId: [],
    localDateTime: [],
    ownerId: [],
    projectionType: [],
    ratio: [],
    stack: [],
    thumbhash: [],
  };
  for (const asset of timelineAsset) {
    bucketAssets.description.push(asset.description);
    bucketAssets.duration.push(asset.duration!);
    bucketAssets.id.push(asset.id);
    bucketAssets.isArchived.push(asset.isArchived ? 1 : 0);
    bucketAssets.isFavorite.push(asset.isFavorite ? 1 : 0);
    bucketAssets.isImage.push(asset.isImage ? 1 : 0);
    bucketAssets.isTrashed.push(asset.isTrashed ? 1 : 0);
    bucketAssets.isVideo.push(asset.isVideo ? 1 : 0);
    bucketAssets.livePhotoVideoId.push(asset.livePhotoVideoId!);
    bucketAssets.localDateTime.push(asset.localDateTime);
    bucketAssets.ownerId.push(asset.ownerId);
    bucketAssets.projectionType.push(asset.projectionType!);
    bucketAssets.ratio.push(asset.ratio);
    bucketAssets.stack.push(asset.stack as TimelineStackResponseDto);
    bucketAssets.thumbhash.push(asset.thumbhash!);
  }
  const response: TimeBucketResponseDto = {
    bucketAssets,
    hasNextPage: false,
  };
  return response;
};
