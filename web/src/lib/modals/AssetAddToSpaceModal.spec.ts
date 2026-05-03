import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import '$lib/__mocks__/sdk.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { SharedSpaceRole, UserAvatarColor, type SharedSpaceResponseDto } from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import AssetAddToSpaceModal from './AssetAddToSpaceModal.svelte';

const { mockAddAssetsToSpace, mockUser } = vi.hoisted(() => ({
  mockAddAssetsToSpace: vi.fn(),
  mockUser: { current: { id: 'u-me', isAdmin: false } },
}));

vi.mock('$lib/services/space.service', () => ({
  addAssetsToSpace: mockAddAssetsToSpace,
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    get authenticated() {
      return mockUser.current !== null;
    },
    get user() {
      return mockUser.current;
    },
  },
}));

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Space',
  description: null,
  createdById: 'owner-id',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  color: UserAvatarColor.Primary,
  thumbnailAssetId: null,
  assetCount: 0,
  memberCount: 1,
  members: [
    {
      userId: 'u-me',
      name: 'Current User',
      email: 'me@test.invalid',
      role: SharedSpaceRole.Editor,
      joinedAt: '2026-01-01T00:00:00.000Z',
      showInTimeline: true,
      sharePersonMetadata: true,
    },
  ],
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  lastActivityAt: null,
  newAssetCount: 0,
  lastViewedAt: null,
  ...overrides,
});

describe('AssetAddToSpaceModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    mockUser.current = { id: 'u-me', isAdmin: false };
    mockAddAssetsToSpace.mockResolvedValue(true);
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  it('closes without adding assets when the picker is dismissed', async () => {
    sdkMock.getAllSpaces.mockResolvedValue([makeSpace()]);

    render(AssetAddToSpaceModal, { assetIds: ['asset-1'], onClose });
    const closeButtons = await screen.findAllByRole('button', { name: 'Close' });
    await fireEvent.click(closeButtons[0]);

    expect(mockAddAssetsToSpace).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('adds selected assets to the chosen space and closes on success', async () => {
    const space = makeSpace({ id: 'space-1', name: 'Family Space' });
    sdkMock.getAllSpaces.mockResolvedValue([space]);

    render(AssetAddToSpaceModal, { assetIds: ['asset-1', 'asset-2'], onClose });
    await fireEvent.click(await screen.findByRole('button', { name: /Family Space/ }));

    expect(mockAddAssetsToSpace).toHaveBeenCalledWith('space-1', ['asset-1', 'asset-2'], { notify: true });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('stays open when adding assets fails', async () => {
    mockAddAssetsToSpace.mockResolvedValue(false);
    sdkMock.getAllSpaces.mockResolvedValue([makeSpace()]);

    render(AssetAddToSpaceModal, { assetIds: ['asset-1'], onClose });
    await fireEvent.click(await screen.findByRole('button', { name: /Family Space/ }));

    expect(mockAddAssetsToSpace).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });
});
