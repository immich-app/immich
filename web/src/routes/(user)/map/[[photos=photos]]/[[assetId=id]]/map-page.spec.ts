import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { SEARCH_FILTER_DEBOUNCE_MS } from '$lib/utils/space-search';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Component } from 'svelte';
import MapPage from './+page.svelte';

const { gotoMock, mockPage, mockAssetViewerManager } = vi.hoisted(() => ({
  gotoMock: vi.fn().mockResolvedValue(undefined),
  mockPage: {
    url: new URL('https://gallery.test/map'),
    route: { id: '/(user)/map/[[photos=photos]]/[[assetId=id]]' },
    params: {},
  },
  mockAssetViewerManager: {
    isViewing: false,
    asset: undefined,
    showAssetViewer: vi.fn(),
    setAssetId: vi.fn().mockResolvedValue(undefined),
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

vi.mock('./MapTimelinePanel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/elements/Portal.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/shared-components/map/map.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/map-component.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/managers/asset-viewer-manager.svelte', () => ({
  assetViewerManager: mockAssetViewerManager,
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: { value: { map: true } },
}));

vi.mock('$lib/utils/navigation', () => ({ navigate: vi.fn() }));

function renderPage() {
  const props = {
    data: {
      meta: { title: 'Map' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof MapPage; componentProps: typeof props }>, {
    component: MapPage,
    componentProps: props,
  });
}

async function flushQueryDebounce() {
  await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);
}

describe('Map page query intersection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    gotoMock.mockResolvedValue(undefined);
    mockPage.url = new URL('https://gallery.test/map');
    sdkMock.getTimeBuckets.mockResolvedValue([]);
    sdkMock.getFilteredMapMarkers.mockResolvedValue([]);
    sdkMock.searchSmart.mockResolvedValue({
      assets: { items: [], nextPage: null },
      albums: { items: [], nextPage: null },
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the existing marker flow when q is absent', async () => {
    sdkMock.getFilteredMapMarkers.mockResolvedValue([{ id: 'asset-1', lat: 1, lon: 2 } as never]);

    renderPage();
    await flushQueryDebounce();

    await waitFor(() => {
      expect(sdkMock.getFilteredMapMarkers).toHaveBeenCalledTimes(1);
      expect(sdkMock.searchSmart).not.toHaveBeenCalled();
      expect(screen.getByTestId('map-stub')).toHaveAttribute('data-marker-ids', 'asset-1');
    });
  });

  it('intersects map markers with paginated searchSmart ids when q is present', async () => {
    mockPage.url = new URL('https://gallery.test/map?q=beach');
    sdkMock.getFilteredMapMarkers.mockResolvedValue([
      { id: 'asset-1', lat: 1, lon: 2 } as never,
      { id: 'asset-2', lat: 2, lon: 3 } as never,
    ]);
    sdkMock.searchSmart.mockResolvedValueOnce({
      assets: { items: [{ id: 'asset-2' }], nextPage: null },
      albums: { items: [], nextPage: null },
    } as never);

    renderPage();
    await flushQueryDebounce();

    await waitFor(() => {
      expect(screen.getByTestId('search-chip')).toHaveTextContent('beach');
      expect(sdkMock.getFilteredMapMarkers).toHaveBeenCalledTimes(1);
      expect(sdkMock.searchSmart).toHaveBeenCalledWith(
        expect.objectContaining({
          smartSearchDto: expect.objectContaining({ query: 'beach', page: 1, size: 100 }),
        }),
      );
      expect(screen.getByTestId('map-stub')).toHaveAttribute('data-marker-ids', 'asset-2');
    });
  });

  it('stops paging once every currently fetched marker id has been matched', async () => {
    mockPage.url = new URL('https://gallery.test/map?q=beach');
    sdkMock.getFilteredMapMarkers.mockResolvedValue([{ id: 'asset-2', lat: 2, lon: 3 } as never]);
    sdkMock.searchSmart.mockResolvedValueOnce({
      assets: { items: [{ id: 'asset-2' }], nextPage: 2 },
      albums: { items: [], nextPage: null },
    } as never);

    renderPage();
    await flushQueryDebounce();

    await waitFor(() => {
      expect(sdkMock.searchSmart).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('map-stub')).toHaveAttribute('data-marker-ids', 'asset-2');
    });
  });

  it('clears q through the URL while preserving the map hash', async () => {
    mockPage.url = new URL('https://gallery.test/map?q=beach#12/48.8566/2.3522');

    renderPage();

    await fireEvent.click(screen.getByTestId('search-chip-close'));

    expect(gotoMock).toHaveBeenCalledWith('/map#12/48.8566/2.3522', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  });
});
