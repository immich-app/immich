import { render } from '@testing-library/svelte';
import AlbumCover from '$lib/components/album-page/AlbumCover.svelte';
import { getAssetMediaUrl } from '$lib/utils';
import { albumFactory } from '@test-data/factories/album-factory';

vi.mock('$lib/utils');

describe('AlbumCover component', () => {
  it('renders an image when the album has a thumbnail', () => {
    vi.mocked(getAssetMediaUrl).mockReturnValue('/asdf');
    const component = render(AlbumCover, {
      album: albumFactory.build({
        albumName: 'someName',
        albumThumbnailAssetId: '123',
      }),
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('someName');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square text');
    expect(img.getAttribute('src')).toBe('/asdf');
    expect(getAssetMediaUrl).toHaveBeenCalledWith({ id: '123' });
  });

  it('renders an image when the album has no thumbnail', () => {
    const component = render(AlbumCover, {
      album: albumFactory.build({
        albumName: '',
        albumThumbnailAssetId: null,
      }),
      preload: true,
      class: 'asdf',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('unnamed_album');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square asdf');
    expect(img.getAttribute('src')).toStrictEqual(expect.any(String));
  });

  it('shows a pin icon when the album is pinned', () => {
    const component = render(AlbumCover, {
      album: albumFactory.build({
        albumName: 'Pinned',
        albumThumbnailAssetId: null,
        isPinned: true,
      }),
    });
    expect(component.getByTitle('Pinned album')).toBeInTheDocument();
  });

  it('does not show a pin icon when the album is not pinned', () => {
    const component = render(AlbumCover, {
      album: albumFactory.build({
        albumName: 'Not Pinned',
        albumThumbnailAssetId: null,
        isPinned: false,
      }),
    });
    expect(component.queryByTitle('Pinned album')).not.toBeInTheDocument();
  });
});
