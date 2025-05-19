import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
import { resetSavedUser, user } from '$lib/stores/user.store';
import { Visibility } from '@immich/sdk';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';

describe('AssetInteraction', () => {
  let assetInteraction: AssetInteraction;

  beforeEach(() => {
    assetInteraction = new AssetInteraction();
  });

  it('calculates derived values from selection', () => {
    assetInteraction.selectAsset(
      timelineAssetFactory.build({ isFavorite: true, visibility: Visibility.Archive, isTrashed: true }),
    );
    assetInteraction.selectAsset(
      timelineAssetFactory.build({ isFavorite: true, visibility: Visibility.Timeline, isTrashed: false }),
    );

    expect(assetInteraction.selectionActive).toBe(true);
    expect(assetInteraction.isAllTrashed).toBe(false);
    expect(assetInteraction.isAllArchived).toBe(false);
    expect(assetInteraction.isAllFavorite).toBe(true);
  });

  it('updates isAllUserOwned when the active user changes', () => {
    const [user1, user2] = userAdminFactory.buildList(2);
    assetInteraction.selectAsset(timelineAssetFactory.build({ ownerId: user1.id }));

    const cleanup = $effect.root(() => {
      expect(assetInteraction.isAllUserOwned).toBe(false);

      user.set(user1);
      expect(assetInteraction.isAllUserOwned).toBe(true);

      user.set(user2);
      expect(assetInteraction.isAllUserOwned).toBe(false);
    });

    cleanup();
    resetSavedUser();
  });
});
