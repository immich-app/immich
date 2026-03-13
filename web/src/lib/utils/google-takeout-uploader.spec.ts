import type { ImportOptions } from '$lib/managers/import-manager.svelte';
import type { TakeoutMediaItem } from '$lib/utils/google-takeout-parser';
import { Action, Reason } from '@immich/sdk';

vi.mock('@immich/sdk', () => ({
  getBaseUrl: vi.fn(() => 'http://localhost'),
  checkBulkUpload: vi.fn(),
  updateAsset: vi.fn(),
  AssetMediaStatus: { Duplicate: 'duplicate', Created: 'created' },
  AssetVisibility: { Archive: 'archive', Timeline: 'timeline' },
  Action: { Reject: 'reject', Accept: 'accept' },
  Reason: { Duplicate: 'duplicate', UnsupportedFormat: 'unsupported-format' },
}));

vi.mock('$lib/utils', () => ({
  uploadRequest: vi.fn(),
}));

vi.mock('$lib/utils/album-utils', () => ({
  createAlbum: vi.fn(),
}));

function makeItem(overrides: Partial<TakeoutMediaItem> = {}): TakeoutMediaItem {
  const file = new File(['fake-image-data'], 'IMG_001.jpg', { type: 'image/jpeg' });
  Object.defineProperty(file, 'lastModified', { value: 1_609_459_200_000 });
  return {
    path: 'Takeout/Google Photos/Trip/IMG_001.jpg',
    file,
    metadata: {
      title: 'IMG_001.jpg',
      description: 'A nice photo',
      dateTaken: new Date('2021-01-01T00:00:00.000Z'),
      latitude: 48.8566,
      longitude: 2.3522,
      isFavorite: true,
      isArchived: false,
    },
    albumName: 'Trip',
    ...overrides,
  };
}

function defaultOptions(): ImportOptions {
  return {
    importFavorites: true,
    importArchived: true,
    importDescriptions: true,
    skipDuplicates: true,
  };
}

describe('uploadTakeoutItem', () => {
  let uploadTakeoutItem: typeof import('$lib/utils/google-takeout-uploader').uploadTakeoutItem;
  let sdkMock: typeof import('@immich/sdk');
  let utilsMock: { uploadRequest: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import('$lib/utils/google-takeout-uploader');
    uploadTakeoutItem = mod.uploadTakeoutItem;
    sdkMock = await import('@immich/sdk');
    utilsMock = (await import('$lib/utils')) as unknown as typeof utilsMock;

    // Default: checkBulkUpload accepts the asset (no duplicate)
    vi.mocked(sdkMock.checkBulkUpload).mockResolvedValue({
      results: [{ id: 'IMG_001.jpg', action: Action.Accept, reason: undefined as unknown as Reason }],
    });
  });

  it('builds FormData with correct fileCreatedAt from Takeout date', async () => {
    utilsMock.uploadRequest.mockResolvedValue({
      data: { id: 'asset-1', status: 'created' },
      status: 201,
    });

    const item = makeItem();
    await uploadTakeoutItem(item, defaultOptions());

    expect(utilsMock.uploadRequest).toHaveBeenCalledOnce();
    const callArgs = utilsMock.uploadRequest.mock.calls[0][0];
    const formData = callArgs.data as FormData;
    expect(formData.get('fileCreatedAt')).toBe('2021-01-01T00:00:00.000Z');
    expect(formData.get('deviceAssetId')).toBe('takeout-IMG_001.jpg-1609459200000');
    expect(formData.get('deviceId')).toBe('WEB_IMPORT');
  });

  it('sets isFavorite when option enabled and item is favorited', async () => {
    utilsMock.uploadRequest.mockResolvedValue({
      data: { id: 'asset-1', status: 'created' },
      status: 201,
    });

    const item = makeItem();
    await uploadTakeoutItem(item, defaultOptions());

    const callArgs = utilsMock.uploadRequest.mock.calls[0][0];
    const formData = callArgs.data as FormData;
    expect(formData.get('isFavorite')).toBe('true');
  });

  it('sets isFavorite to false when option disabled', async () => {
    utilsMock.uploadRequest.mockResolvedValue({
      data: { id: 'asset-1', status: 'created' },
      status: 201,
    });

    const item = makeItem();
    const options = { ...defaultOptions(), importFavorites: false };
    await uploadTakeoutItem(item, options);

    const callArgs = utilsMock.uploadRequest.mock.calls[0][0];
    const formData = callArgs.data as FormData;
    expect(formData.get('isFavorite')).toBe('false');
  });

  it('calls updateAsset with GPS coordinates after upload', async () => {
    utilsMock.uploadRequest.mockResolvedValue({
      data: { id: 'asset-1', status: 'created' },
      status: 201,
    });

    const item = makeItem();
    await uploadTakeoutItem(item, defaultOptions());

    expect(sdkMock.updateAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'asset-1',
        updateAssetDto: expect.objectContaining({
          latitude: 48.8566,
          longitude: 2.3522,
        }),
      }),
    );
  });

  it('calls updateAsset with description after upload', async () => {
    utilsMock.uploadRequest.mockResolvedValue({
      data: { id: 'asset-1', status: 'created' },
      status: 201,
    });

    const item = makeItem();
    await uploadTakeoutItem(item, defaultOptions());

    expect(sdkMock.updateAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'asset-1',
        updateAssetDto: expect.objectContaining({
          description: 'A nice photo',
        }),
      }),
    );
  });

  it('sets visibility to archive when item is archived and option enabled', async () => {
    utilsMock.uploadRequest.mockResolvedValue({
      data: { id: 'asset-1', status: 'created' },
      status: 201,
    });

    const item = makeItem({
      metadata: {
        title: 'IMG_001.jpg',
        description: undefined,
        dateTaken: new Date('2021-01-01T00:00:00.000Z'),
        latitude: undefined,
        longitude: undefined,
        isFavorite: false,
        isArchived: true,
      },
    });
    await uploadTakeoutItem(item, defaultOptions());

    expect(sdkMock.updateAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'asset-1',
        updateAssetDto: expect.objectContaining({
          visibility: 'archive',
        }),
      }),
    );
  });

  it('skips metadata updates when options disabled', async () => {
    utilsMock.uploadRequest.mockResolvedValue({
      data: { id: 'asset-1', status: 'created' },
      status: 201,
    });

    const item = makeItem();
    const options: ImportOptions = {
      importFavorites: false,
      importArchived: false,
      importDescriptions: false,
      skipDuplicates: false,
    };
    await uploadTakeoutItem(item, options);

    // updateAsset should still be called for GPS and date but not description/archive
    if (vi.mocked(sdkMock.updateAsset).mock.calls.length > 0) {
      const updateDto = vi.mocked(sdkMock.updateAsset).mock.calls[0][0].updateAssetDto;
      expect(updateDto).not.toHaveProperty('description');
      expect(updateDto).not.toHaveProperty('visibility');
    }
  });

  it('returns duplicate status when dedup check rejects', async () => {
    vi.mocked(sdkMock.checkBulkUpload).mockResolvedValue({
      results: [{ id: 'IMG_001.jpg', assetId: 'existing-asset-1', action: Action.Reject, reason: Reason.Duplicate }],
    });

    const item = makeItem();
    const result = await uploadTakeoutItem(item, defaultOptions());

    expect(result.status).toBe('duplicate');
    expect(result.assetId).toBe('existing-asset-1');
    expect(utilsMock.uploadRequest).not.toHaveBeenCalled();
  });

  it('returns error on upload failure', async () => {
    utilsMock.uploadRequest.mockRejectedValue(new Error('Network error'));

    const item = makeItem();
    const result = await uploadTakeoutItem(item, defaultOptions());

    expect(result.status).toBe('error');
    expect(result.error).toContain('Network error');
  });
});

describe('createImportAlbums', () => {
  let createImportAlbums: typeof import('$lib/utils/google-takeout-uploader').createImportAlbums;
  let createAlbumMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import('$lib/utils/google-takeout-uploader');
    createImportAlbums = mod.createImportAlbums;
    const albumUtils = await import('$lib/utils/album-utils');
    createAlbumMock = vi.mocked(albumUtils.createAlbum);
  });

  it('creates albums for selected album names', async () => {
    createAlbumMock.mockResolvedValue({ id: 'album-1', albumName: 'Trip' });

    const items: TakeoutMediaItem[] = [
      makeItem({ path: 'Takeout/Google Photos/Trip/IMG_001.jpg', albumName: 'Trip' }),
      makeItem({ path: 'Takeout/Google Photos/Trip/IMG_002.jpg', albumName: 'Trip' }),
    ];
    const assetIdMap = new Map([
      ['Takeout/Google Photos/Trip/IMG_001.jpg', 'asset-1'],
      ['Takeout/Google Photos/Trip/IMG_002.jpg', 'asset-2'],
    ]);

    const count = await createImportAlbums(items, assetIdMap, new Set(['Trip']));

    expect(createAlbumMock).toHaveBeenCalledWith('Trip', ['asset-1', 'asset-2']);
    expect(count).toBe(1);
  });

  it('adds correct assets to each album', async () => {
    createAlbumMock.mockResolvedValue({ id: 'album-1' });

    const items: TakeoutMediaItem[] = [
      makeItem({ path: 'a/Trip/IMG_001.jpg', albumName: 'Trip' }),
      makeItem({ path: 'a/Vacation/IMG_002.jpg', albumName: 'Vacation' }),
      makeItem({ path: 'a/Trip/IMG_003.jpg', albumName: 'Trip' }),
    ];
    const assetIdMap = new Map([
      ['a/Trip/IMG_001.jpg', 'asset-1'],
      ['a/Vacation/IMG_002.jpg', 'asset-2'],
      ['a/Trip/IMG_003.jpg', 'asset-3'],
    ]);

    await createImportAlbums(items, assetIdMap, new Set(['Trip', 'Vacation']));

    expect(createAlbumMock).toHaveBeenCalledWith('Trip', ['asset-1', 'asset-3']);
    expect(createAlbumMock).toHaveBeenCalledWith('Vacation', ['asset-2']);
  });

  it('skips unselected albums', async () => {
    createAlbumMock.mockResolvedValue({ id: 'album-1' });

    const items: TakeoutMediaItem[] = [
      makeItem({ path: 'a/Trip/IMG_001.jpg', albumName: 'Trip' }),
      makeItem({ path: 'a/Vacation/IMG_002.jpg', albumName: 'Vacation' }),
    ];
    const assetIdMap = new Map([
      ['a/Trip/IMG_001.jpg', 'asset-1'],
      ['a/Vacation/IMG_002.jpg', 'asset-2'],
    ]);

    await createImportAlbums(items, assetIdMap, new Set(['Trip']));

    expect(createAlbumMock).toHaveBeenCalledOnce();
    expect(createAlbumMock).toHaveBeenCalledWith('Trip', ['asset-1']);
  });

  it('returns count of albums created', async () => {
    createAlbumMock.mockResolvedValue({ id: 'album-1' });

    const items: TakeoutMediaItem[] = [
      makeItem({ path: 'a/Trip/IMG_001.jpg', albumName: 'Trip' }),
      makeItem({ path: 'a/Vacation/IMG_002.jpg', albumName: 'Vacation' }),
      makeItem({ path: 'a/Family/IMG_003.jpg', albumName: 'Family' }),
    ];
    const assetIdMap = new Map([
      ['a/Trip/IMG_001.jpg', 'asset-1'],
      ['a/Vacation/IMG_002.jpg', 'asset-2'],
      ['a/Family/IMG_003.jpg', 'asset-3'],
    ]);

    const count = await createImportAlbums(items, assetIdMap, new Set(['Trip', 'Vacation', 'Family']));
    expect(count).toBe(3);
  });

  it('handles album creation failure gracefully', async () => {
    createAlbumMock
      .mockResolvedValueOnce({ id: 'album-1' })
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce({ id: 'album-3' });

    const items: TakeoutMediaItem[] = [
      makeItem({ path: 'a/Trip/IMG_001.jpg', albumName: 'Trip' }),
      makeItem({ path: 'a/Bad/IMG_002.jpg', albumName: 'Bad' }),
      makeItem({ path: 'a/Good/IMG_003.jpg', albumName: 'Good' }),
    ];
    const assetIdMap = new Map([
      ['a/Trip/IMG_001.jpg', 'asset-1'],
      ['a/Bad/IMG_002.jpg', 'asset-2'],
      ['a/Good/IMG_003.jpg', 'asset-3'],
    ]);

    // Should not throw
    const count = await createImportAlbums(items, assetIdMap, new Set(['Trip', 'Bad', 'Good']));
    // Only 2 succeeded
    expect(count).toBe(2);
  });
});
