import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import Thumbnail from '$lib/components/assets/thumbnail/Thumbnail.svelte';
import { getTabbable } from '$lib/utils/focus-util';
import { assetFactory } from '@test-data/factories/asset-factory';
import { vi, describe, it, expect} from 'vitest'

vi.mock('$lib/utils/navigation', () => ({
  currentUrlReplaceAssetId: vi.fn(),
  isSharedLinkRoute: vi.fn().mockReturnValue(false),
}));

vi.mock('$lib/services/asset.service', () => ({
  toggleFavoriteAsset: vi.fn()
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: { isSharedLink: false}
}));

import * as assetService from '$lib/services/asset.service'


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
});

describe('Thumbnail component - favorite button', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heart button only when asset.isFavorite  is true', async () => {
    const asset = assetFactory.build({isFavorite: true});
    const updatedAsset = { ...asset, isFavorite: false };

    (assetService.toggleFavoriteAsset as ReturnType<typeof vi.fn>).mockResolvedValue(updatedAsset);

    const { getByLabelText } = render(Thumbnail, { asset, selected: true});

    const btn = getByLabelText('unfavorite');
    expect(btn).toBeTruthy();

    await fireEvent.click(btn);

    expect(assetService.toggleFavoriteAsset).toHaveBeenCalledWith(
      expect.objectContaining({ id: asset.id, isFavorite: false}),
      false,
    );
  });

  it('reverts the optimistic update when the service call fails', async () => {
    const asset = assetFactory.build({ isFavorite: true });
    (assetService.toggleFavoriteAsset as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('network error'));

    const { getByLabelText, queryByLabelText } = render(Thumbnail, {
      asset, selected: true });

    await fireEvent.click(getByLabelText('unfavorite'));

    await waitFor(() => {
      expect(queryByLabelText('unfavorite')).toBeTruthy();
    });
  });

  it('does not render heart button when asset.isFavorite is false', () => {
    const asset  = assetFactory.build({ isFavorite: false })

    const { queryByLabelText } = render(Thumbnail, { asset, selected: true });

    expect(queryByLabelText('unfavorite')).toBeNull();
  });

  it('clicking the heart does not bubble to the container', async () => {
    const asset = assetFactory.build({ isFavorite: true });
    (assetService.toggleFavoriteAsset as ReturnType<typeof vi.fn>).mockResolvedValue(
      {...asset, isFavorite: false });

    const onClick = vi.fn();
    const onSelect = vi.fn();

    const { baseElement, getByLabelText } = render(Thumbnail, {
      asset,
      selected: false,
      onClick,
      onSelect,
    });

    const parentClick = vi.fn();
    baseElement.addEventListener('click', parentClick);

    const btn = getByLabelText('unfavorite');
    await fireEvent.click(btn);

    expect(assetService.toggleFavoriteAsset).toHaveBeenCalled();
    expect(parentClick).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});