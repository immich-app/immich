import { AssetVisibility, type AssetResponseDto, type AssetTypeEnum } from '@immich/sdk';
import { render } from 'vitest-browser-svelte';
import LargeAssetData from './LargeAssetData.svelte';

describe('LargeAssetData', () => {
  const dummyAsset: AssetResponseDto = {
    id: 'asset-1',
    ownerId: 'user-1',
    type: 'IMAGE' as AssetTypeEnum,
    originalPath: '/photos/photo1.jpg',
    originalFileName: 'photo1.jpg',
    resized: false,
    thumbhash: null,
    fileCreatedAt: '2026-01-01T00:00:00.000Z',
    fileModifiedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    localDateTime: '2026-01-01T00:00:00.000Z',
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    isEdited: false,
    isOffline: false,
    hasMetadata: true,
    height: 100,
    width: 100,
    duration: null,
    exifInfo: {
      fileSizeInByte: 10_485_760,
    },
    livePhotoVideoId: null,
    tags: [],
    checksum: 'abc',
    visibility: AssetVisibility.Archive,
  };

  it('does not render raw JSON in card title attribute', async () => {
    const onViewAsset = vi.fn();
    const { baseElement } = await render(LargeAssetData, {
      asset: dummyAsset,
      onViewAsset,
    });

    const card = baseElement.querySelector('.aspect-square');
    expect(card).not.toBeNull();
    expect(card?.getAttribute('title')).toBeNull();
  });

  it('keeps filename in title attribute of filename element', async () => {
    const onViewAsset = vi.fn();
    const { baseElement } = await render(LargeAssetData, {
      asset: dummyAsset,
      onViewAsset,
    });

    const filenameDiv = baseElement.querySelector('.truncate');
    expect(filenameDiv).not.toBeNull();
    expect(filenameDiv?.getAttribute('title')).toBe('photo1.jpg');
    expect(filenameDiv?.textContent?.trim()).toBe('photo1.jpg');
  });
});
