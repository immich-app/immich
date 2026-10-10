import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { writable } from 'svelte/store';
import { albumFactory } from '@test-data/factories/album-factory';
import AlbumSummary from '../AlbumSummary.svelte';

vitest.mock('$lib/stores/preferences.store', () => ({
  locale: writable('en'),
}));

describe('AlbumSummary component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('updates the date range when the start date of the album changes', async () => {
    const album = albumFactory.build({
      startDate: '2026-06-10T12:00:00.000Z',
      endDate: '2026-06-20T12:00:00.000Z',
      assetCount: 3,
    });
    const { rerender } = render(AlbumSummary, { album });
    expect(screen.getByTestId('album-details')).toHaveTextContent('Jun 10');

    await rerender({ album: { ...album, startDate: '2026-06-15T12:00:00.000Z', assetCount: 2 } });

    const details = screen.getByTestId('album-details');
    expect(details).toHaveTextContent('Jun 15');
    expect(details).not.toHaveTextContent('Jun 10');
  });
});
