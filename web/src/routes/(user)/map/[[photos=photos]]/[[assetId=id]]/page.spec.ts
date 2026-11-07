import { Route } from '#lib/route.ts';
import { mapSettings, type MapSettings } from '#lib/stores/preferences.store.ts';
import { test } from '#test/unit/fixtures.ts';
import { afterEach, describe, expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

const defaultSettings: MapSettings = {
  allowDarkMode: true,
  includeArchived: false,
  onlyFavorites: false,
  withPartners: false,
  withSharedAlbums: false,
  showAssetPanel: false,
  relativeDate: '',
};

describe('map page', () => {
  test.beforeEach(async ({ router }) => {
    await router.goto(Route.map());
    await import('#lib/components/shared-components/map/Map.svelte');
  });

  afterEach(() => {
    mapSettings.set(defaultSettings);
  });

  test('marker request leaves out empty saved dates', async ({ render, api }) => {
    mapSettings.set({ ...defaultSettings, withPartners: true, dateAfter: '', dateBefore: '' });

    await render(Page, load);

    await expect.poll(() => api.getMapMarkers.calls).toHaveLength(1);
    expect(api.getMapMarkers).toHaveBeenCalledWith({ params: { withPartners: true } });
  });

  test('marker request uses the saved custom date range', async ({ render, api }) => {
    mapSettings.set({
      ...defaultSettings,
      dateAfter: '2024-01-01T00:00:00.000Z',
      dateBefore: '2024-12-31T00:00:00.000Z',
    });

    await render(Page, load);

    await expect.poll(() => api.getMapMarkers.calls).toHaveLength(1);
    expect(api.getMapMarkers).toHaveBeenCalledWith({
      params: { fileCreatedAfter: '2024-01-01T00:00:00.000Z', fileCreatedBefore: '2024-12-31T00:00:00.000Z' },
    });
  });

  test('asset panel asks for timeline visibility when partner assets are included', async ({ render, api }) => {
    mapSettings.set({ ...defaultSettings, showAssetPanel: true, includeArchived: true, withPartners: true });

    await render(Page, load);

    await expect.poll(() => api.getTimeBuckets.calls.length).toBeGreaterThan(0);
    expect(api.getTimeBuckets).toHaveBeenCalledWith({
      params: expect.objectContaining({ visibility: 'timeline', withPartners: true }),
    });
  });
});
