import { renderWithTooltips } from '$tests/helpers';
import { AssetTypeEnum, AssetVisibility, type AssetResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import DetailPanel from './detail-panel.svelte';

const { getAllAlbumsMock, getAssetInfoMock } = vi.hoisted(() => ({
  getAllAlbumsMock: vi.fn(),
  getAssetInfoMock: vi.fn(),
}));

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return {
    ...actual,
    getAllAlbums: getAllAlbumsMock,
    getAssetInfo: getAssetInfoMock,
  };
});

vi.mock('$app/navigation', () => ({ goto: vi.fn().mockResolvedValue(undefined) }));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    authenticated: true,
    user: { id: 'owner-1' },
    isSharedLink: false,
    params: {},
    preferences: {
      tags: { enabled: false },
      ratings: { enabled: false },
    },
  },
}));

vi.mock('$lib/managers/asset-viewer-manager.svelte', () => ({
  assetViewerManager: {
    closeEditFacesPanel: vi.fn(),
  },
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: {
    value: { smartSearch: false },
  },
}));

vi.mock('$lib/components/asset-viewer/detail-panel-date.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-description.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-location.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-star-rating.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/detail-panel-tags.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/faces-page/person-side-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/OnEvents.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/user-avatar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/asset-viewer/album-list-item-details.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/LoadingSpinner.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

describe('DetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllAlbumsMock.mockResolvedValue([]);
    getAssetInfoMock.mockResolvedValue(undefined);
  });

  it('uses the shared-space person thumbnail URL when spacePersonId is present', () => {
    const asset: AssetResponseDto = {
      id: 'asset-1',
      ownerId: 'owner-1',
      libraryId: 'library-1',
      type: AssetTypeEnum.Image,
      originalPath: '/library/asset-1.jpg',
      originalFileName: 'asset-1.jpg',
      originalMimeType: 'image/jpeg',
      thumbhash: 'thumbhash',
      createdAt: '2026-01-01T00:00:00.000Z',
      fileCreatedAt: '2026-01-01T00:00:00.000Z',
      fileModifiedAt: '2026-01-01T00:00:00.000Z',
      localDateTime: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      isFavorite: false,
      isArchived: false,
      isTrashed: false,
      duration: null,
      checksum: 'checksum',
      isOffline: false,
      hasMetadata: false,
      visibility: AssetVisibility.Timeline,
      width: 1000,
      height: 800,
      isEdited: false,
      people: [
        {
          id: 'global-person-1',
          name: 'Alice',
          thumbnailPath: '/ignored.jpg',
          updatedAt: '2026-01-02T00:00:00.000Z',
          isHidden: false,
          birthDate: null,
          type: 'person',
          faces: [],
          spacePersonId: 'space-person-1',
        },
      ],
      unassignedFaces: [],
    };

    const { container } = renderWithTooltips(DetailPanel, {
      asset,
      currentAlbum: null,
      spaceId: 'space-1',
    });

    const image = container.querySelector('img[src*="/shared-spaces/space-1/people/space-person-1/thumbnail"]');
    expect(image).toBeTruthy();
  });
});
