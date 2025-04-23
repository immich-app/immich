import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
import { getTabbable } from '$lib/utils/focus-util';
import { assetFactory } from '@test-data/factories/asset-factory';
import { fireEvent, render, screen } from '@testing-library/svelte';

vi.hoisted(() => {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    enumerable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('Thumbnail component', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.mock('$lib/utils/navigation', () => ({
      currentUrlReplaceAssetId: vi.fn(),
    }));
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

    // Guarding against inserting extra tabbable elments in future in <Thumbnail/>
    const tabbables = getTabbable(container!);
    expect(tabbables.length).toBe(0);
  });
});
