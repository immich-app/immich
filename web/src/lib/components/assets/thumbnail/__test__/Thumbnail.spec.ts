import { fireEvent, render } from '@testing-library/svelte';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import Thumbnail from '$lib/components/assets/thumbnail/Thumbnail.svelte';
import { getTabbable } from '$lib/utils/focus-util';
import { assetFactory, timelineAssetFactory } from '@test-data/factories/asset-factory';

vi.mock('$lib/utils/navigation', () => ({
  currentUrlReplaceAssetId: vi.fn(),
  isSharedLinkRoute: vi.fn().mockReturnValue(false),
}));

vi.hoisted(() => {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    enumerable: true,
    value: vi.fn().mockImplementation(function (query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
});

describe('Thumbnail component', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  it('should only contain a single tabbable element (the container)', () => {
    const asset = assetFactory.build({ originalPath: 'image.jpg', originalMimeType: 'image/jpeg' });
    const { baseElement } = render(Thumbnail, {
      asset,
      selected: true,
    });

    const container = baseElement.querySelector('[data-thumbnail-focus-container]');
    expect(container).not.toBeNull();
    expect(container!.getAttribute('tabindex')).toBe('0');

    // Guarding against inserting extra tabbable elements in future in <Thumbnail/>
    const tabbables = getTabbable(container!);
    expect(tabbables.length).toBe(0);
  });

  it('shows thumbhash while image is loading', () => {
    const asset = assetFactory.build({ originalPath: 'image.jpg', originalMimeType: 'image/jpeg' });
    const sut = render(Thumbnail, {
      asset,
      selected: true,
    });

    const thumbhash = sut.getByTestId('thumbhash');
    expect(thumbhash).not.toBeFalsy();
  });

  it('loads the new cache URL when a successful thumbnail receives a new media revision', async () => {
    const asset = timelineAssetFactory.build({ mediaRevision: 'first-render', thumbhash: null });
    const { baseElement, rerender } = render(Thumbnail, { asset });
    const originalImage = baseElement.querySelector('img')!;
    await fireEvent.load(originalImage);

    await rerender({ asset: { ...asset, mediaRevision: 'second-render' } });

    const image = baseElement.querySelector('img')!;
    expect(image).not.toBe(originalImage);
    expect(image.getAttribute('src')).toContain('c=second-render');
  });

  it('retries a broken thumbnail when background publication supplies a new media revision', async () => {
    const asset = timelineAssetFactory.build({ mediaRevision: 'before-generation', thumbhash: null });
    const { baseElement, rerender } = render(Thumbnail, { asset });
    await fireEvent.error(baseElement.querySelector('img')!);
    expect(baseElement.querySelector('[data-broken-asset]')).not.toBeNull();

    await rerender({ asset: { ...asset, mediaRevision: 'published-generation' } });

    expect(baseElement.querySelector('[data-broken-asset]')).toBeNull();
    const image = baseElement.querySelector('img')!;
    expect(image.getAttribute('src')).toContain('c=published-generation');
    await fireEvent.load(image);
    expect(baseElement.querySelector('[data-broken-asset]')).toBeNull();
  });
});
