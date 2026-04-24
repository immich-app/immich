import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import type { SharedSpaceMemberResponseDto, SharedSpaceResponseDto } from '@immich/sdk';
import { SharedSpaceRole } from '@immich/sdk';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';
import SpacesPage from './+page.svelte';

const { gotoMock, mockPage, mockAssetMultiSelectManager, mockAuthManager, mockEventManager } = vi.hoisted(() => ({
  gotoMock: vi.fn().mockResolvedValue(undefined),
  mockPage: {
    url: new URL('https://gallery.test/spaces/space-1/photos'),
    route: { id: '/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]' },
    params: { spaceId: 'space-1' },
  },
  mockAssetMultiSelectManager: {
    selectionActive: false,
    assets: [],
    clear: vi.fn(),
    isAllUserOwned: true,
  },
  mockAuthManager: {
    user: { id: 'user-1', isAdmin: false, name: 'Owner', email: 'owner@example.com' },
  },
  mockEventManager: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('$app/navigation', () => ({ goto: gotoMock }));
vi.mock('$app/state', () => ({ page: mockPage }));

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/OnEvents.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/filter-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/bindable-filter-panel.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/active-filters-bar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/search-sort-dropdown.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/filter-panel/sort-toggle.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/search/smart-search-results.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/smart-search-results.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/context-menu/button-context-menu.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/spaces/space-map.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/spaces/space-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/Timeline.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/bindable-timeline.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/managers/asset-multi-select-manager.svelte', () => ({
  assetMultiSelectManager: mockAssetMultiSelectManager,
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({ authManager: mockAuthManager }));
vi.mock('$lib/managers/command-context-manager.svelte', () => ({ registerSpaceContext: vi.fn() }));
vi.mock('$lib/managers/event-manager.svelte', () => ({ eventManager: mockEventManager }));
vi.mock('$lib/utils/space-hero-storage', () => ({
  loadHeroCollapsed: vi.fn().mockReturnValue(false),
  persistHeroCollapsed: vi.fn(),
}));

function makeSpace(overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto {
  return {
    id: 'space-1',
    name: 'Test Space',
    createdById: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    assetCount: 3,
    memberCount: 1,
    faceRecognitionEnabled: false,
    hasPets: false,
    petsEnabled: false,
    color: 'primary',
    recentAssetIds: [],
    recentAssetThumbhashes: [],
    members: [],
    thumbnailAssetId: null,
    thumbnailCropY: null,
    newAssetCount: 0,
    ...overrides,
  } as SharedSpaceResponseDto;
}

function makeMember(overrides: Partial<SharedSpaceMemberResponseDto> = {}): SharedSpaceMemberResponseDto {
  return {
    userId: 'user-1',
    email: 'owner@example.com',
    name: 'Owner',
    role: SharedSpaceRole.Owner,
    showInTimeline: true,
    joinedAt: '2026-01-01T00:00:00.000Z',
    contributionCount: 0,
    ...overrides,
  };
}

function renderPage() {
  const props = {
    data: {
      space: makeSpace(),
      members: [makeMember()],
      meta: { title: 'Test Space' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof SpacesPage; componentProps: typeof props }>, {
    component: SpacesPage,
    componentProps: props,
  });
}

describe('Spaces page search URL sync', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    gotoMock.mockResolvedValue(undefined);
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
    mockPage.url = new URL('https://gallery.test/spaces/space-1/photos');
    vi.mocked(sdkMock.markSpaceViewed).mockResolvedValue(void 0 as never);
    sdkMock.getSpaceActivities.mockResolvedValue([]);
    sdkMock.getSpacePeople.mockResolvedValue([]);
  });

  it('hydrates the in-page search input from q', () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?q=beach');

    renderPage();

    expect(screen.getByPlaceholderText(/search/i)).toHaveValue('beach');
    expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'beach');
  });

  it('commits a trimmed query on Enter and preserves other params', async () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?view=grid');

    renderPage();

    const input = screen.getByPlaceholderText(/search/i);
    await fireEvent.input(input, { target: { value: '  beach  ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(gotoMock).toHaveBeenCalledWith('/spaces/space-1/photos?view=grid&q=beach', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  });

  it('drops a stale asset id when committing a search', async () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-1/photos/asset-123?view=grid');

    renderPage();

    const input = screen.getByPlaceholderText(/search/i);
    await fireEvent.input(input, { target: { value: 'beach' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(gotoMock).toHaveBeenCalledWith('/spaces/space-1/photos?view=grid&q=beach', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  });

  it('commits the draft query on blur', async () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-1/photos');

    renderPage();

    const input = screen.getByPlaceholderText(/search/i);
    const outsideButton = document.createElement('button');
    document.body.append(outsideButton);

    await fireEvent.input(input, { target: { value: 'beach' } });
    await fireEvent.blur(input, { relatedTarget: outsideButton });

    expect(gotoMock).toHaveBeenCalledWith('/spaces/space-1/photos?q=beach', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });

    outsideButton.remove();
  });

  it('clears q while preserving unrelated params', async () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?q=beach&view=grid');

    renderPage();

    await fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(gotoMock).toHaveBeenCalledWith('/spaces/space-1/photos?view=grid', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
    expect(screen.getByPlaceholderText(/search/i)).toHaveValue('');
  });
});
