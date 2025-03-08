import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import { fireEvent, render, screen } from '@testing-library/svelte';

describe('Thumbnail component', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  it('should only contain a single tabbable element (the container)', () => {
    const asset = assetFactory.build({ originalPath: 'image.jpg', originalMimeType: 'image/jpeg' });
    render(Thumbnail, {
      asset,
      focussed: false,
      overrideDisplayForTest: true,
      selected: true,
    });

    const container = screen.getByTestId('container-with-tabindex');
    expect(container.getAttribute('tabindex')).toBe('0');

    // This isn't capturing all tabbable elements, but should be the most likely ones. Mainly guarding against
    // inserting extra tabbable elments in future in <Thumbnail/>
    let allTabbableElements = screen.queryAllByRole('link');
    allTabbableElements = allTabbableElements.concat(screen.queryAllByRole('checkbox'));
    expect(allTabbableElements.length).toBeGreaterThan(0);
    for (const tabbableElement of allTabbableElements) {
      const testIdValue = tabbableElement.dataset.testid;
      if (testIdValue === null || testIdValue !== 'container-with-tabindex') {
        expect(tabbableElement.getAttribute('tabindex')).toBe('-1');
      }
    }
  });

  it('handleFocus should be called on focus of container', async () => {
    const asset = assetFactory.build({ originalPath: 'image.jpg', originalMimeType: 'image/jpeg' });
    const handleFocusSpy = vi.fn();
    render(Thumbnail, {
      asset,
      overrideDisplayForTest: true,
      handleFocus: handleFocusSpy,
    });

    const container = screen.getByTestId('container-with-tabindex');
    await fireEvent(container, new FocusEvent('focus'));

    expect(handleFocusSpy).toBeCalled();
  });

  it('element will be focussed if not already', () => {
    const asset = assetFactory.build({ originalPath: 'image.jpg', originalMimeType: 'image/jpeg' });
    const handleFocusSpy = vi.fn();
    render(Thumbnail, {
      asset,
      overrideDisplayForTest: true,
      focussed: true,
      handleFocus: handleFocusSpy,
    });

    expect(handleFocusSpy).toBeCalled();
  });
});
