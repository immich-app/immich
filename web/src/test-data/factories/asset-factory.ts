import type { TimelineAsset } from '$lib/stores/assets-store.svelte';
import { fromISODateTimeUTCToObject, fromTimelinePlainDateTime } from '$lib/utils/timeline-util';
import { faker } from '@faker-js/faker';
import { AssetTypeEnum, AssetVisibility, type AssetResponseDto, type TimeBucketAssetResponseDto } from '@immich/sdk';
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
  visibility: AssetVisibility.Timeline,
});

export const timelineAssetFactory = Sync.makeFactory<TimelineAsset>({
  id: Sync.each(() => faker.string.uuid()),
  ratio: Sync.each(() => faker.number.int()),
  ownerId: Sync.each(() => faker.string.uuid()),
  thumbhash: Sync.each(() => faker.string.alphanumeric(28)),
  localDateTime: Sync.each(() => fromISODateTimeUTCToObject(faker.date.past().toISOString())),
  fileCreatedAt: Sync.each(() => fromISODateTimeUTCToObject(faker.date.past().toISOString())),
  isFavorite: Sync.each(() => faker.datatype.boolean()),
  visibility: AssetVisibility.Timeline,
  isTrashed: false,
  isImage: true,
  isVideo: false,
  duration: '0:00:00.00000',
  stack: null,
  projectionType: null,
  livePhotoVideoId: Sync.each(() => faker.string.uuid()),
  city: faker.location.city(),
  country: faker.location.country(),
  people: [faker.person.fullName()],
});

export const toResponseDto = (...timelineAsset: TimelineAsset[]) => {
  const bucketAssets: TimeBucketAssetResponseDto = {
    city: [],
    country: [],
    duration: [],
    id: [],
    visibility: [],
    isFavorite: [],
    isImage: [],
    isTrashed: [],
    livePhotoVideoId: [],
    fileCreatedAt: [],
    localOffsetMinutes: [],
    ownerId: [],
    projectionType: [],
    ratio: [],
    stack: [],
    thumbhash: [],
  };
  for (const asset of timelineAsset) {
    const fileCreatedAt = fromTimelinePlainDateTime(asset.fileCreatedAt).toISO();
    bucketAssets.city.push(asset.city);
    bucketAssets.country.push(asset.country);
    bucketAssets.duration.push(asset.duration!);
    bucketAssets.id.push(asset.id);
    bucketAssets.visibility.push(asset.visibility);
    bucketAssets.isFavorite.push(asset.isFavorite);
    bucketAssets.isImage.push(asset.isImage);
    bucketAssets.isTrashed.push(asset.isTrashed);
    bucketAssets.livePhotoVideoId.push(asset.livePhotoVideoId!);
    bucketAssets.fileCreatedAt.push(fileCreatedAt);
    bucketAssets.ownerId.push(asset.ownerId);
    bucketAssets.projectionType.push(asset.projectionType!);
    bucketAssets.ratio.push(asset.ratio);
    bucketAssets.stack?.push(asset.stack ? [asset.stack.id, asset.stack.assetCount.toString()] : null);
    bucketAssets.thumbhash.push(asset.thumbhash!);
  }

  return bucketAssets;
};
