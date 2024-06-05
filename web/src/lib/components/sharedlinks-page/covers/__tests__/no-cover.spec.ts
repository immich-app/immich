import NoCover from '$lib/components/sharedlinks-page/covers/no-cover.svelte';
import { render } from '@testing-library/svelte';

describe('NoCover component', () => {
  it('renders correctly', () => {
    const component = render(NoCover, {
      alt: '123',
      preload: true,
      class: 'asdf',
    });
    const img = component.getByTestId('album-image') as HTMLImageElement;
    expect(img.alt).toBe('123');
    expect(img.className).toBe('z-0 rounded-xl object-cover asdf');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.src).toStrictEqual(expect.any(String));
  });
});
