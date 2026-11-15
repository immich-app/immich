import Image from '#lib/components/Image.svelte';
import { cancelImageUrl } from '#lib/utils/sw-messaging.ts';
import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';

vi.mock('#lib/utils/sw-messaging.js', () => ({
  cancelImageUrl: vi.fn(),
}));

describe('Image component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an img element when src is provided', async () => {
    const { baseElement } = await render(Image, { src: '/test.jpg', alt: 'test' });
    const img = baseElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('/test.jpg');
  });

  it('does not render an img element when src is undefined', async () => {
    const { baseElement } = await render(Image, { src: undefined });
    const img = baseElement.querySelector('img');
    expect(img).toBeNull();
  });

  it('calls onStart when src is set', async () => {
    const onStart = vi.fn();
    await render(Image, { src: '/test.jpg', onStart });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('calls onLoad when image loads', async () => {
    const onLoad = vi.fn();
    const { baseElement } = await render(Image, { src: '/test.jpg', onLoad });
    const img = baseElement.querySelector('img')!;
    img.dispatchEvent(new Event('load'));
    expect(onLoad).toHaveBeenCalledOnce();
  });

  it('calls onError when image fails to load', async () => {
    const onError = vi.fn();
    const { baseElement } = await render(Image, { src: '/test.jpg', onError });
    const img = baseElement.querySelector('img')!;
    img.dispatchEvent(new Event('error'));
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe('Failed to load image: /test.jpg');
  });

  it('calls cancelImageUrl on unmount', async () => {
    const { unmount } = await render(Image, { src: '/test.jpg' });
    expect(cancelImageUrl).not.toHaveBeenCalled();
    await unmount();
    expect(cancelImageUrl).toHaveBeenCalledWith('/test.jpg');
  });

  it('does not call onLoad after unmount', async () => {
    const onLoad = vi.fn();
    const { baseElement, unmount } = await render(Image, { src: '/test.jpg', onLoad });
    const img = baseElement.querySelector('img')!;
    await unmount();
    img.dispatchEvent(new Event('load'));
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('does not call onError after unmount', async () => {
    const onError = vi.fn();
    const { baseElement, unmount } = await render(Image, { src: '/test.jpg', onError });
    const img = baseElement.querySelector('img')!;
    await unmount();
    img.dispatchEvent(new Event('error'));
    expect(onError).not.toHaveBeenCalled();
  });
});
