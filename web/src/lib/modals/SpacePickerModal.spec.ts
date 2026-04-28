import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import '$lib/__mocks__/sdk.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { SharedSpaceRole, UserAvatarColor, type SharedSpaceResponseDto } from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import SpacePickerModal from './SpacePickerModal.svelte';

const { mockUser } = vi.hoisted(() => ({
  mockUser: { current: { id: 'u-me', isAdmin: false } },
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

const makeSpace = (
  overrides: Partial<SharedSpaceResponseDto> & { role?: SharedSpaceRole; memberUserId?: string } = {},
): SharedSpaceResponseDto => {
  const role = overrides.role ?? SharedSpaceRole.Editor;
  const memberUserId = overrides.memberUserId ?? 'u-me';
  return {
    id: 'space-1',
    name: 'Family Space',
    description: null,
    createdById: role === SharedSpaceRole.Owner ? 'u-me' : 'owner-id',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    color: UserAvatarColor.Primary,
    thumbnailAssetId: null,
    assetCount: 0,
    memberCount: 1,
    members: [
      {
        userId: memberUserId,
        name: 'Current User',
        email: 'me@test.invalid',
        role,
        joinedAt: '2026-01-01T00:00:00.000Z',
        showInTimeline: true,
      },
    ],
    recentAssetIds: [],
    recentAssetThumbhashes: [],
    lastActivityAt: null,
    newAssetCount: 0,
    lastViewedAt: null,
    ...overrides,
  };
};

describe('SpacePickerModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    mockUser.current = { id: 'u-me', isAdmin: false };
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  it('shows owner and editor spaces and hides viewer spaces', async () => {
    sdkMock.getAllSpaces.mockResolvedValue([
      makeSpace({ id: 'owner-space', name: 'Owner Space', role: SharedSpaceRole.Owner }),
      makeSpace({ id: 'editor-space', name: 'Editor Space', role: SharedSpaceRole.Editor }),
      makeSpace({ id: 'viewer-space', name: 'Viewer Space', role: SharedSpaceRole.Viewer }),
    ]);

    render(SpacePickerModal, { onClose });

    expect(await screen.findByRole('button', { name: /Owner Space/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editor Space/ })).toBeInTheDocument();
    expect(screen.queryByText('Viewer Space')).not.toBeInTheDocument();
  });

  it('treats createdById as an owner fallback when member rows are missing', async () => {
    sdkMock.getAllSpaces.mockResolvedValue([
      makeSpace({ id: 'created-space', name: 'Created Space', createdById: 'u-me', members: [] }),
    ]);

    render(SpacePickerModal, { onClose });

    expect(await screen.findByRole('button', { name: /Created Space/ })).toBeInTheDocument();
  });

  it('filters writable spaces by search text', async () => {
    sdkMock.getAllSpaces.mockResolvedValue([
      makeSpace({ id: 'family-space', name: 'Family Space' }),
      makeSpace({ id: 'work-space', name: 'Work Space' }),
    ]);

    render(SpacePickerModal, { onClose });
    await screen.findByText('Family Space');

    await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'work' } });

    expect(screen.queryByText('Family Space')).not.toBeInTheDocument();
    expect(screen.getByText('Work Space')).toBeInTheDocument();
  });

  it('shows an empty state when no writable spaces match', async () => {
    sdkMock.getAllSpaces.mockResolvedValue([makeSpace({ id: 'viewer-space', role: SharedSpaceRole.Viewer })]);

    render(SpacePickerModal, { onClose });

    expect(await screen.findByText('spaces_no_writable_spaces')).toBeInTheDocument();
  });

  it('shows the empty state when spaces fail to load', async () => {
    sdkMock.getAllSpaces.mockRejectedValue(new Error('network'));

    render(SpacePickerModal, { onClose });

    expect(await screen.findByText('spaces_no_writable_spaces')).toBeInTheDocument();
  });

  it('returns the selected writable space', async () => {
    const target = makeSpace({ id: 'target-space', name: 'Target Space', role: SharedSpaceRole.Editor });
    sdkMock.getAllSpaces.mockResolvedValue([target]);

    render(SpacePickerModal, { onClose });
    await fireEvent.click(await screen.findByRole('button', { name: /Target Space/ }));

    expect(onClose).toHaveBeenCalledWith(target);
  });
});
