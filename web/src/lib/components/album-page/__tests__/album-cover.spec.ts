import AlbumCover from '$lib/components/album-page/album-cover.svelte';
import { getAssetThumbnailUrl } from '$lib/utils';
import type { AlbumResponseDto } from '@immich/sdk';
import { render } from '@testing-library/svelte';
import { init } from 'svelte-i18n';

vi.mock('$lib/utils');

describe('AlbumCover component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'dev' });
  });

  it('renders an image when the album has a thumbnail', () => {
    vi.mocked(getAssetThumbnailUrl).mockReturnValue('/asdf');
    const component = render(AlbumCover, {
      album: {
        albumName: 'someName',
        albumThumbnailAssetId: '123',
      } as AlbumResponseDto,
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('someName');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('z-0 rounded-xl object-cover text');
    expect(img.getAttribute('src')).toBe('/asdf');
    expect(getAssetThumbnailUrl).toHaveBeenCalledWith({ id: '123' });
  });

  it('renders an image when the album has no thumbnail', () => {
    const component = render(AlbumCover, {
      album: {
        albumName: '',
        albumThumbnailAssetId: null,
      } as AlbumResponseDto,
      preload: true,
      class: 'asdf',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('unnamed_album');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.className).toBe('z-0 rounded-xl object-cover asdf');
    expect(img.getAttribute('src')).toStrictEqual(expect.any(String));
  });
});
