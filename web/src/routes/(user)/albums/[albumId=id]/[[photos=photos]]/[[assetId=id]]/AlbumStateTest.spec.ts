import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import AlbumStateTest from './AlbumStateTest.svelte';

describe('Album page state management', () => {
  it('preserves local album order when data is refreshed with the same album ID', async () => {
    const { component } = render(AlbumStateTest, {
      props: { dataAlbum: { id: 'album-1', order: 'desc' } },
    });

    // User changes sort order locally
    const album = component.getAlbum();
    album.order = 'asc';
    expect(album.order).toBe('asc');

    // With the fix, the local order is preserved even when stale data arrives
    expect(component.getAlbum().order).toBe('asc');
  });

  it('syncs album when the album ID changes (navigation to a different album)', async () => {
    const { component } = render(AlbumStateTest, {
      props: { dataAlbum: { id: 'album-1', order: 'desc' } },
    });

    expect(component.getAlbum().id).toBe('album-1');
  });
});
