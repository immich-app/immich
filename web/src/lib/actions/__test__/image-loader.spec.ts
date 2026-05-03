import { loadImage } from '$lib/actions/image-loader.svelte';

vi.mock('$lib/utils/sw-messaging', () => ({
  cancelImageUrl: vi.fn(),
}));

describe('loadImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets anonymous CORS before assigning src', () => {
    const originalCreateElement = document.createElement.bind(document);
    const img = originalCreateElement('img');
    const operations: string[] = [];

    Object.defineProperty(img, 'crossOrigin', {
      configurable: true,
      set: (value: string) => operations.push(`crossOrigin:${value}`),
    });
    Object.defineProperty(img, 'src', {
      configurable: true,
      set: (value: string) => operations.push(`src:${value}`),
    });

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'img') {
        return img;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    loadImage('/preview.jpg', vi.fn(), vi.fn());

    expect(operations).toEqual(['crossOrigin:anonymous', 'src:/preview.jpg']);
  });
});
