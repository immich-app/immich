import { faker } from '@faker-js/faker';
import { AssetTypeEnum, AssetVisibility, type AssetResponseDto, type StackResponseDto } from '@immich/sdk';
import { BrowserContext } from '@playwright/test';
import { randomPreview, randomThumbnail } from 'src/ui/generators/timeline';

export type MockStack = {
  id: string;
  primaryAssetId: string;
  assets: AssetResponseDto[];
  brokenAssetIds: Set<string>;
  assetMap: Map<string, AssetResponseDto>;
};

export const createMockStackAsset = (ownerId: string): AssetResponseDto => {
  const assetId = faker.string.uuid();
  const now = new Date().toISOString();
  return {
    id: assetId,
    deviceAssetId: `device-${assetId}`,
    ownerId,
    owner: {
      id: ownerId,
      email: 'admin@immich.cloud',
      name: 'Admin',
      profileImagePath: '',
      profileChangedAt: now,
      avatarColor: 'blue' as never,
    },
    libraryId: `library-${ownerId}`,
    deviceId: `device-${ownerId}`,
    type: AssetTypeEnum.Image,
    originalPath: `/original/${assetId}.jpg`,
    originalFileName: `${assetId}.jpg`,
    originalMimeType: 'image/jpeg',
    thumbhash: null,
    fileCreatedAt: now,
    fileModifiedAt: now,
    localDateTime: now,
    updatedAt: now,
    createdAt: now,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    visibility: AssetVisibility.Timeline,
    duration: '0:00:00.00000',
    exifInfo: {
      make: null,
      model: null,
      exifImageWidth: 3000,
      exifImageHeight: 4000,
      fileSizeInByte: null,
      orientation: null,
      dateTimeOriginal: now,
      modifyDate: null,
      timeZone: null,
      lensModel: null,
      fNumber: null,
      focalLength: null,
      iso: null,
      exposureTime: null,
      latitude: null,
      longitude: null,
      city: null,
      country: null,
      state: null,
      description: null,
    },
    livePhotoVideoId: null,
    tags: [],
    people: [],
    unassignedFaces: [],
    stack: null,
    isOffline: false,
    hasMetadata: true,
    duplicateId: null,
    resized: true,
    checksum: faker.string.alphanumeric({ length: 28 }),
    width: 3000,
    height: 4000,
    isEdited: false,
  };
};

export const createMockStack = (
  primaryAssetDto: AssetResponseDto,
  additionalAssets: AssetResponseDto[],
  brokenAssetIds?: Set<string>,
): MockStack => {
  const stackId = faker.string.uuid();
  const allAssets = [primaryAssetDto, ...additionalAssets];
  const resolvedBrokenIds = brokenAssetIds ?? new Set(additionalAssets.map((a) => a.id));
  const assetMap = new Map(allAssets.map((a) => [a.id, a]));

  primaryAssetDto.stack = {
    id: stackId,
    assetCount: allAssets.length,
    primaryAssetId: primaryAssetDto.id,
  };

  return {
    id: stackId,
    primaryAssetId: primaryAssetDto.id,
    assets: allAssets,
    brokenAssetIds: resolvedBrokenIds,
    assetMap,
  };
};

export const setupBrokenAssetMockApiRoutes = async (context: BrowserContext, mockStack: MockStack) => {
  await context.route('**/api/stacks/*', async (route, request) => {
    if (request.method() !== 'GET') {
      return route.fallback();
    }
    const stackResponse: StackResponseDto = {
      id: mockStack.id,
      primaryAssetId: mockStack.primaryAssetId,
      assets: mockStack.assets,
    };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: stackResponse,
    });
  });

  await context.route('**/api/assets/*', async (route, request) => {
    if (request.method() !== 'GET') {
      return route.fallback();
    }
    const url = new URL(request.url());
    const segments = url.pathname.split('/');
    const assetId = segments.at(-1);
    if (assetId && mockStack.assetMap.has(assetId)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockStack.assetMap.get(assetId),
      });
    }
    return route.fallback();
  });

  await context.route('**/api/assets/*/thumbnail?size=*', async (route, request) => {
    if (!route.request().serviceWorker()) {
      return route.continue();
    }
    const pattern = /\/api\/assets\/(?<assetId>[^/]+)\/thumbnail\?size=(?<size>preview|thumbnail)/;
    const match = request.url().match(pattern);
    if (!match?.groups || !mockStack.assetMap.has(match.groups.assetId)) {
      return route.fallback();
    }
    if (mockStack.brokenAssetIds.has(match.groups.assetId)) {
      return route.fulfill({ status: 404 });
    }
    const asset = mockStack.assetMap.get(match.groups.assetId)!;
    const ratio = (asset.exifInfo?.exifImageWidth ?? 3000) / (asset.exifInfo?.exifImageHeight ?? 4000);
    const body =
      match.groups.size === 'preview'
        ? await randomPreview(match.groups.assetId, ratio)
        : await randomThumbnail(match.groups.assetId, ratio);
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
      body,
    });
  });
};
