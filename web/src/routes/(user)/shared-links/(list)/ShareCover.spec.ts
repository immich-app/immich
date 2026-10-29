import { getAssetMediaUrl } from '#lib/utils.ts';
import { factory } from '#test/unit/factories.ts';
import { render, screen } from '@testing-library/svelte';
import ShareCover from './ShareCover.svelte';

vi.mock('#lib/utils.js');

describe('ShareCover component', () => {
  it('renders an image when the shared link is an album', () => {
    const component = render(ShareCover, {
      sharedLink: factory.sharedLink({ album: factory.album({ albumName: '123' }) }),
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('123');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square text');
  });

  it('renders an image when the shared link is an individual share', () => {
    vi.mocked(getAssetMediaUrl).mockReturnValue('/asdf');
    const component = render(ShareCover, {
      sharedLink: factory.sharedLink({ assets: [factory.asset({ id: 'someId' })] }),
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('individual_share');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square text');
    expect(img.getAttribute('src')).toBe('/asdf');
    expect(getAssetMediaUrl).toHaveBeenCalledWith({ id: 'someId' });
  });

  it('renders an image when the shared link has no album or assets', () => {
    const component = render(ShareCover, {
      sharedLink: factory.sharedLink(),
      preload: false,
      class: 'text',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('unnamed_share');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square text');
  });

  it.skip('renders fallback image when asset is not resized', () => {
    const sharedLink = factory.sharedLink({ assets: [factory.asset()] });
    render(ShareCover, {
      sharedLink,
      preload: false,
    });

    // TODO emit image error event and check if fallback image is rendered

    const img = screen.getByTestId<HTMLImageElement>('album-image');
    expect(img.alt).toBe('unnamed_share');
  });
});
