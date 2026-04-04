import { AssetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
import { resetSavedUser, user } from '$lib/stores/user.store';
import { AssetVisibility } from '@immich/sdk';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';

describe('AssetMultiSelectManager', () => {
  let sut: AssetMultiSelectManager;

  beforeEach(() => {
    sut = new AssetMultiSelectManager();
  });

  it('calculates derived values from selection', () => {
    sut.selectAsset(
      timelineAssetFactory.build({ isFavorite: true, visibility: AssetVisibility.Archive, isTrashed: true }),
    );
    sut.selectAsset(
      timelineAssetFactory.build({ isFavorite: true, visibility: AssetVisibility.Timeline, isTrashed: false }),
    );

    expect(sut.selectionActive).toBe(true);
    expect(sut.isAllTrashed).toBe(false);
    expect(sut.isAllArchived).toBe(false);
    expect(sut.isAllFavorite).toBe(true);
  });

  it('updates isAllUserOwned when the active user changes', () => {
    const [user1, user2] = userAdminFactory.buildList(2);
    sut.selectAsset(timelineAssetFactory.build({ ownerId: user1.id }));

    const cleanup = $effect.root(() => {
      expect(sut.isAllUserOwned).toBe(false);

      user.set(user1);
      expect(sut.isAllUserOwned).toBe(true);

      user.set(user2);
      expect(sut.isAllUserOwned).toBe(false);
    });

    cleanup();
    resetSavedUser();
  });
});
