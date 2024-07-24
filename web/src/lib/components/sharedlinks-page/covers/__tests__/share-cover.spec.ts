import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
import { getAssetThumbnailUrl } from '$lib/utils';
import type { SharedLinkResponseDto } from '@immich/sdk';
import { albumFactory } from '@test-data';
import { render } from '@testing-library/svelte';

vi.mock('$lib/utils');

describe('ShareCover component', () => {
  it('renders an image when the shared link is an album', () => {
    const component = render(ShareCover, {
      link: {
        album: albumFactory.build({
          albumName: '123',
        }),
      } as SharedLinkResponseDto,
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('123');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('z-0 rounded-xl object-cover text');
  });

  it('renders an image when the shared link is an individual share', () => {
    vi.mocked(getAssetThumbnailUrl).mockReturnValue('/asdf');
    const component = render(ShareCover, {
      link: {
        assets: [
          {
            id: 'someId',
          },
        ],
      } as SharedLinkResponseDto,
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('individual_share');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('z-0 rounded-xl object-cover text');
    expect(img.getAttribute('src')).toBe('/asdf');
    expect(getAssetThumbnailUrl).toHaveBeenCalledWith('someId');
  });

  it('renders an image when the shared link has no album or assets', () => {
    const component = render(ShareCover, {
      link: {
        assets: [],
      } as unknown as SharedLinkResponseDto,
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('unnamed_share');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('z-0 rounded-xl object-cover text');
  });
});
