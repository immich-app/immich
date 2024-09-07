import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
import { getAssetThumbnailUrl } from '$lib/utils';
import { albumFactory } from '@test-data/factories/album-factory';
import { assetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { render, screen } from '@testing-library/svelte';

vi.mock('$lib/utils');

describe('ShareCover component', () => {
  it('renders an image when the shared link is an album', () => {
    const component = render(ShareCover, {
      link: sharedLinkFactory.build({ album: albumFactory.build({ albumName: '123' }) }),
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('123');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square text');
  });

  it('renders an image when the shared link is an individual share', () => {
    vi.mocked(getAssetThumbnailUrl).mockReturnValue('/asdf');
    const component = render(ShareCover, {
      link: sharedLinkFactory.build({ assets: [assetFactory.build({ id: 'someId' })] }),
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('individual_share');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square text');
    expect(img.getAttribute('src')).toBe('/asdf');
    expect(getAssetThumbnailUrl).toHaveBeenCalledWith('someId');
  });

  it('renders an image when the shared link has no album or assets', () => {
    const component = render(ShareCover, {
      link: sharedLinkFactory.build(),
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('unnamed_share');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square text');
  });

  it.skip('renders fallback image when asset is not resized', () => {
    const link = sharedLinkFactory.build({ assets: [assetFactory.build()] });
    render(ShareCover, {
      link,
      preload: false,
    });

    // TODO emit image error event and check if fallback image is rendered

    const img = screen.getByTestId<HTMLImageElement>('album-image');
    expect(img.alt).toBe('unnamed_share');
  });
});
