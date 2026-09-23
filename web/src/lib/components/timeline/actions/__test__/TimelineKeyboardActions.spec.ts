import { fireEvent, render } from '@testing-library/svelte';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import TimelineKeyboardActions from '$lib/components/timeline/actions/TimelineKeyboardActions.svelte';
import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import { toggleFavoriteAssets } from '$lib/utils/asset-utils';

vi.mock('$lib/utils/asset-utils', () => ({
  toggleFavoriteAssets: vi.fn(),
}));

describe('ToggleFavoriteSelected (Bulk Favorite Shortcut)', () => {
  let timelineManager: TimelineManager;

  beforeAll(() => {
    timelineManager = new TimelineManager();
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pressing f triggers toggleFavoriteSelected', async () => {
    const assetInteraction = {
      selectionActive: true,
      ownedAssets: [
        { id: '1', isFavorite: false },
        { id: '2', isFavorite: false },
      ],
      clear: vi.fn(),
    };

    const { container } = render(TimelineKeyboardActions, {
      props: {
        timelineManager,
        assetInteraction,
        scrollToAsset: vi.fn(),
      },
    });

    await fireEvent.keyDown(container, { key: 'f'});

    expect(toggleFavoriteAssets).toHaveBeenCalledWith(
      [{ id: '1', isFavorite: false}, { id: '2', isFavorite: false}],
      true
    );
  });

  it('No action pressing f, when selection is inactive', async () => {
    const assetInteraction = {
      selectionActive: false,
      ownedAssets: [],
      clear: vi.fn(),
    };

    const { container } = render(TimelineKeyboardActions, {
      props: {
        timelineManager,
        assetInteraction,
        scrollToAsset: vi.fn(),
      },
    });

    await fireEvent.keyDown(container, { key: 'f'});

    expect(toggleFavoriteAssets).not.toHaveBeenCalled();
  });

  it('Shortcut passes only assets needing update', async () => {
    const assetInteraction = {
      selectionActive: true,
      ownedAssets: [
        { id: '1', isFavorite: true },
        { id: '2', isFavorite: false },
        { id: '3', isFavorite: true },
      ],
      clear: vi.fn(),
    };

    const { container } = render(TimelineKeyboardActions, {
      props: {
        timelineManager,
        assetInteraction,
        scrollToAsset: vi.fn(),
      },
    });

    await fireEvent.keyDown(container, { key: 'f'});

    expect(toggleFavoriteAssets).toHaveBeenCalledWith(
      [{ id: '2', isFavorite: false}],
      true
    );
  });

  it('Shortcut clears selection after toggling', async () => {
    const assetInteraction = {
      selectionActive: true,
      ownedAssets: [ 
        { id: '1', isFavorite: false},
        { id: '2', isFavorite: false},
        { id: '3', isFavorite: false},
        { id: '4', isFavorite: false},
        { id: '5', isFavorite: false},
      ],
      clear: vi.fn(),
    };

    const { container } = render(TimelineKeyboardActions, {
      props: {
        timelineManager,
        assetInteraction,
        scrollToAsset: vi.fn(),
      },
    });

    await fireEvent.keyDown(container, { key: 'f'});

    expect(assetInteraction.clear).toHaveBeenCalled();
  });
});