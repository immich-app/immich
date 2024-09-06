import AssetCover from '$lib/components/sharedlinks-page/covers/asset-cover.svelte';
import { render } from '@testing-library/svelte';

describe('AssetCover component', () => {
  it('renders correctly', () => {
    const component = render(AssetCover, {
      alt: '123',
      preload: true,
      src: 'wee',
      class: 'asdf',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('123');
    expect(img.getAttribute('src')).toBe('wee');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.className).toBe('size-full rounded-xl object-cover aspect-square asdf');
  });
});
