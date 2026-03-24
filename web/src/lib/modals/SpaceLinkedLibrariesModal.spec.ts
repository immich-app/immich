import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import '$lib/__mocks__/sdk.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';

vi.mock('svelte-persisted-store', async () => {
  const { writable } = await import('svelte/store');
  return {
    persisted: (_key: string, initialValue: unknown) => writable(initialValue),
  };
});

vi.mock('$lib/utils/tunables', () => ({
  TUNABLES: {
    LAYOUT: { WASM: true },
    TIMELINE: { INTERSECTION_EXPAND_TOP: 500, INTERSECTION_EXPAND_BOTTOM: 500 },
  },
}));

import type { SharedSpaceResponseDto } from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import SpaceLinkedLibrariesModal from './SpaceLinkedLibrariesModal.svelte';

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Photos',
  description: '',
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 1,
  assetCount: 0,
  thumbnailAssetId: null,
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  lastActivityAt: null,
  newAssetCount: 0,
  members: [],
  linkedLibraries: [],
  ...overrides,
});

describe('SpaceLinkedLibrariesModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    sdkMock.getAllLibraries.mockResolvedValue([]);
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  it('should render modal with "Connected Libraries" title', () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    const elements = screen.getAllByText('Connected Libraries');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render the SpaceLinkedLibraries component inside', () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    expect(screen.getByTestId('linked-libraries')).toBeInTheDocument();
  });

  it('should show empty state when no libraries are linked', () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    expect(screen.getByText('No libraries connected yet')).toBeInTheDocument();
  });

  it('should show linked libraries when present', () => {
    const space = makeSpace({
      linkedLibraries: [{ libraryId: 'lib-1', libraryName: 'My Photos', createdAt: '2026-01-01T00:00:00.000Z' }],
    });
    render(SpaceLinkedLibrariesModal, { space, onClose });
    expect(screen.getByText('My Photos')).toBeInTheDocument();
  });

  it('should call onClose with false when closed without changes', async () => {
    render(SpaceLinkedLibrariesModal, { space: makeSpace(), onClose });
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    await fireEvent.click(closeButtons[0]);
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith(false);
    });
  });
});
