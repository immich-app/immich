import { findMemoryAsset, getMemoryViewerExitRoute, removeAssetsFromMemoryList } from '$lib/utils/memory-viewer-source';
import { AssetTypeEnum, AssetVisibility, MemoryType, type AssetResponseDto, type MemoryResponseDto } from '@immich/sdk';

const asset = (id: string): AssetResponseDto => ({
  id,
  checksum: `${id}-checksum`,
  createdAt: '2024-01-01T00:00:00.000Z',
  duration: null,
  exifInfo: {
    city: 'Cape Town',
    country: 'South Africa',
    latitude: -33.9249,
    longitude: 18.4241,
    projectionType: null,
    timeZone: 'Africa/Johannesburg',
  },
  fileCreatedAt: '2024-01-01T10:00:00.000Z',
  fileModifiedAt: '2024-01-01T10:00:00.000Z',
  hasMetadata: true,
  height: 3000,
  isArchived: false,
  isEdited: false,
  isFavorite: false,
  isOffline: false,
  isTrashed: false,
  libraryId: 'library-id',
  localDateTime: '2024-01-01T12:00:00.000Z',
  originalFileName: `${id}.jpg`,
  originalMimeType: 'image/jpeg',
  originalPath: `/upload/${id}.jpg`,
  ownerId: 'owner-id',
  people: [
    {
      birthDate: null,
      faces: [],
      id: `${id}-person`,
      isHidden: false,
      name: 'Ada Lovelace',
      thumbnailPath: '',
    },
  ],
  tags: [
    {
      createdAt: '2024-01-01T00:00:00.000Z',
      id: `${id}-tag`,
      name: 'holiday',
      updatedAt: '2024-01-01T00:00:00.000Z',
      value: 'holiday',
    },
  ],
  thumbhash: `${id}-thumbhash`,
  type: AssetTypeEnum.Image,
  updatedAt: '2024-01-01T00:00:00.000Z',
  visibility: AssetVisibility.Timeline,
  width: 4000,
});

const memory = (id: string, assetIds: string[]): MemoryResponseDto => ({
  assets: assetIds.map((id) => asset(id)),
  createdAt: '2024-01-01T00:00:00.000Z',
  data: {},
  id,
  isSaved: false,
  memoryAt: '2024-01-01T00:00:00.000Z',
  ownerId: 'owner-id',
  type: MemoryType.OnThisDay,
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('memory viewer source', () => {
  const memories = [memory('m1', ['a1', 'a2']), memory('m2', ['a3']), memory('m3', ['a4'])];

  it('finds a selected asset with its memory and neighboring context', () => {
    const selected = findMemoryAsset(memories, 'a2');

    expect(selected?.memoryIndex).toBe(0);
    expect(selected?.assetIndex).toBe(1);
    expect(selected?.memory).toBe(memories[0]);
    expect(selected?.asset.id).toBe('a2');
    expect(selected?.previousMemory).toBeUndefined();
    expect(selected?.nextMemory).toBe(memories[1]);
    expect(selected?.previous?.asset.id).toBe('a1');
    expect(selected?.next?.asset.id).toBe('a3');
  });

  it('falls back to the first asset when the selected asset is missing', () => {
    const selected = findMemoryAsset(memories, 'missing');

    expect(selected?.memoryIndex).toBe(0);
    expect(selected?.assetIndex).toBe(0);
    expect(selected?.memory).toBe(memories[0]);
    expect(selected?.asset.id).toBe('a1');
    expect(selected?.previous).toBeUndefined();
    expect(selected?.next?.asset.id).toBe('a2');
  });

  it('removes selected assets and drops empty memories', () => {
    const remaining = removeAssetsFromMemoryList(memories, ['a1', 'a3']);

    expect(remaining.map((memory) => memory.id)).toEqual(['m1', 'm3']);
    expect(remaining.map((memory) => memory.assets.map((asset) => asset.id))).toEqual([['a2'], ['a4']]);
    expect(remaining[0]).not.toBe(memories[0]);
    expect(memories[0].assets.map((asset) => asset.id)).toEqual(['a1', 'a2']);
  });

  it('returns to the memories index when exiting the history viewer', () => {
    expect(getMemoryViewerExitRoute('history')).toBe('/memories');
    expect(getMemoryViewerExitRoute()).toBe('/photos');
  });
});
