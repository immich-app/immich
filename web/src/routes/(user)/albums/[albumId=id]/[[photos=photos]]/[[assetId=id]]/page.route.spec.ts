import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { albumFactory } from '@test-data/factories/album-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AlbumPage from './+page.svelte';

const { registerAlbumContextMock, registerSelectionContextMock } = vi.hoisted(() => ({
  registerAlbumContextMock: vi.fn(),
  registerSelectionContextMock: vi.fn(),
}));

vi.mock('$lib/components/timeline/Timeline.svelte', async () => {
  const { default: MockTimeline } = await import('./mock-timeline.test-wrapper.svelte');
  return { default: MockTimeline };
});

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerAlbumContext: registerAlbumContextMock,
  registerSelectionContext: registerSelectionContextMock,
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: {
    init: vi.fn(),
    loadFeatureFlags: vi.fn(),
    value: { map: false },
  } as never,
}));

vi.mock('$lib/utils/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils/navigation')>();
  return {
    ...actual,
    isAlbumsRoute: () => true,
    navigate: vi.fn().mockResolvedValue(undefined),
  };
});

function renderPage(album = albumFactory.build({ assetCount: 2 })) {
  authManager.setUser(userAdminFactory.build({ id: album.ownerId }));
  authManager.setPreferences(preferencesFactory.build());

  sdkMock.getFilterSuggestions.mockImplementation((request: { albumId?: string } = {}) => {
    if (request.albumId) {
      const personName =
        request.albumId === 'album-2'
          ? 'Second Album Person'
          : request.albumId === 'album-1'
            ? 'First Album Person'
            : 'Album Person';
      const tagName =
        request.albumId === 'album-2'
          ? 'Second Album Tag'
          : request.albumId === 'album-1'
            ? 'First Album Tag'
            : 'Album Tag';
      return Promise.resolve({
        countries: [],
        cameraMakes: [],
        tags: [
          { id: 'tag-view', value: tagName },
          { id: 'tag-no-match', value: 'No Match' },
        ],
        people: [{ id: 'person-view', name: personName }],
        ratings: [5],
        mediaTypes: ['IMAGE'],
        hasUnnamedPeople: false,
      });
    }

    return Promise.resolve({
      countries: [],
      cameraMakes: [],
      tags: [
        { id: 'tag-picker', value: 'Picker Tag' },
        { id: 'tag-no-match', value: 'No Match' },
      ],
      people: [{ id: 'person-picker', name: 'Picker Person' }],
      ratings: [5],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: false,
    });
  });

  sdkMock.getSearchSuggestions.mockImplementation((() => Promise.resolve([] as string[])) as never);

  return render(TestWrapper, {
    component: AlbumPage,
    componentProps: {
      data: {
        album,
        asset: undefined,
        error: undefined,
        meta: { title: album.albumName },
      },
    },
  });
}

describe('album detail filter panel route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assetMultiSelectManager.clear();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders the filter panel in view mode and select-assets mode', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByTestId('discovery-panel')).toBeInTheDocument());
    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('discovery-panel')).toBeInTheDocument());
  });

  it('hides the filter panel when the active dataset is empty and no filters are active', async () => {
    renderPage(albumFactory.build({ assetCount: 0 }));

    await waitFor(() => expect(screen.queryByTestId('discovery-panel')).not.toBeInTheDocument());
  });

  it('registers cmdk selection context for album view mode only', async () => {
    renderPage();

    expect(registerSelectionContextMock).toHaveBeenCalledOnce();
    const options = registerSelectionContextMock.mock.calls[0][0];
    expect(options.canAddToAlbum()).toBe(true);
    expect(options.getAssets()).toBe(assetMultiSelectManager.assets);
    expect(options.getOnFavorite()).toEqual(expect.any(Function));
    expect(options.getOnArchive()).toEqual(expect.any(Function));
    expect(options.getOnDelete()).toEqual(expect.any(Function));
    expect(options.getOnUndoDelete()).toEqual(expect.any(Function));

    await fireEvent.click(screen.getByLabelText('add_photos'));
    expect(options.getAssets()).toEqual([]);
    expect(options.canAddToAlbum()).toBe(false);
    expect(options.getOnFavorite()).toBeUndefined();
    expect(options.getOnArchive()).toBeUndefined();
    expect(options.getOnDelete()).toBeUndefined();
    expect(options.getOnUndoDelete()).toBeUndefined();
  });

  it('does not expose timeline-backed cmdk callbacks before the album timeline manager is bound', () => {
    renderPage(albumFactory.build({ id: 'without-bound-timeline-manager', assetCount: 2 }));

    expect(registerSelectionContextMock).toHaveBeenCalledOnce();
    const options = registerSelectionContextMock.mock.calls[0][0];
    expect(options.canAddToAlbum()).toBe(true);
    expect(options.getAssets()).toBe(assetMultiSelectManager.assets);
    expect(options.getOnFavorite()).toBeUndefined();
    expect(options.getOnArchive()).toBeUndefined();
    expect(options.getOnDelete()).toBeUndefined();
    expect(options.getOnUndoDelete()).toBeUndefined();
  });

  it('keeps the filter panel visible when timeline months exist but the manager asset count is zero', async () => {
    renderPage(albumFactory.build({ id: 'timeline-months-only', assetCount: 2 }));

    await waitFor(() => expect(screen.getByTestId('discovery-panel')).toBeInTheDocument());
  });

  it('keeps separate filter state for view and select-assets, and reuses view filters for select-thumbnail', async () => {
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('people-item-person-view')).toBeInTheDocument());
    await user.click(screen.getByTestId('people-item-person-view'));
    expect(screen.getByTestId('active-chip')).toHaveTextContent('Album Person');

    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('people-item-person-picker')).toBeInTheDocument());
    expect(screen.queryByTestId('active-chip')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('people-item-person-picker'));
    expect(screen.getByTestId('active-chip')).toHaveTextContent('Picker Person');

    await fireEvent.click(screen.getByLabelText('close'));
    expect(screen.getByTestId('active-chip')).toHaveTextContent('Album Person');

    await fireEvent.click(screen.getByLabelText('add_photos'));
    expect(screen.getByTestId('active-chip')).toHaveTextContent('Picker Person');

    await fireEvent.click(screen.getByLabelText('close'));
    await user.click(screen.getByLabelText('album_options'));
    await user.click(screen.getByText('select_album_cover'));
    expect(screen.getByTestId('discovery-panel')).toBeInTheDocument();
    expect(screen.getByTestId('active-chip')).toHaveTextContent('Album Person');
  });

  it('applies favorites independently in album view and picker modes', async () => {
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('favorites-only')).toBeInTheDocument());
    await user.click(screen.getByTestId('favorites-only'));

    expect(screen.getByTestId('active-chip')).toHaveTextContent('Favorites');
    expect(screen.getByTestId('timeline-options').textContent).toContain('"isFavorite":true');

    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('favorites-only')).toBeInTheDocument());
    expect(screen.queryByTestId('active-chip')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('favorites-only'));

    expect(screen.getByTestId('active-chip')).toHaveTextContent('Favorites');
    expect(screen.getByTestId('timeline-options').textContent).toContain('"timelineAlbumId":"');
    expect(screen.getByTestId('timeline-options').textContent).toContain('"isFavorite":true');
    expect(screen.getByTestId('timeline-options').textContent).not.toContain('"withPartners":true');
  });

  it('keeps timelineAlbumId in picker options after filters change and shows filtered empty state', async () => {
    renderPage();
    const user = userEvent.setup();

    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('tags-item-tag-no-match')).toBeInTheDocument());
    expect(screen.getByTestId('timeline-options').textContent).toContain('"timelineAlbumId"');

    await user.click(screen.getByTestId('tags-item-tag-picker'));
    expect(screen.getByTestId('timeline-options').textContent).toContain('"timelineAlbumId"');

    await user.click(screen.getByTestId('tags-item-tag-no-match'));
    expect(screen.getByText('No photos available to add match your filters')).toBeInTheDocument();
    await user.click(screen.getByText('Clear all filters'));
    await waitFor(() =>
      expect(screen.queryByText('No photos available to add match your filters')).not.toBeInTheDocument(),
    );
  });

  it('keeps already-in-album assets disabled after picker filters change', async () => {
    renderPage();
    const user = userEvent.setup();

    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('tags-item-tag-picker')).toBeInTheDocument());
    await user.click(screen.getByTestId('tags-item-tag-picker'));

    expect(screen.getByTestId('timeline-options').textContent).toContain('"timelineAlbumId"');
    expect(screen.getByTestId('mock-disabled-asset')).toHaveAttribute('data-disabled', 'true');
  });

  it('resets both filter states and label caches when navigating to another album', async () => {
    const firstAlbum = albumFactory.build({ id: 'album-1', assetCount: 2 });
    const secondAlbum = albumFactory.build({ id: 'album-2', assetCount: 2 });
    const view = renderPage(firstAlbum);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('people-item-person-view')).toBeInTheDocument());
    await user.click(screen.getByTestId('people-item-person-view'));
    expect(screen.getByTestId('active-chip')).toHaveTextContent('First Album Person');

    await view.rerender({
      component: AlbumPage,
      componentProps: {
        data: {
          album: secondAlbum,
          asset: undefined,
          error: undefined,
          meta: { title: secondAlbum.albumName },
        },
      },
    });

    await waitFor(() => expect(screen.queryByTestId('active-chip')).not.toBeInTheDocument());
    expect(screen.queryByTestId('active-chip')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('people-item-person-view')).toBeInTheDocument());
    await user.click(screen.getByTestId('people-item-person-view'));
    expect(screen.getByTestId('active-chip')).toHaveTextContent('Second Album Person');
    expect(screen.queryByText('First Album Person')).not.toBeInTheDocument();
  });
});
