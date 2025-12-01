import { PersistedLocalStorage } from '$lib/utils/persisted';

class AlbumSettingsManager {
  #showAssetOwners = new PersistedLocalStorage<boolean>('album-show-asset-owners', false);

  get showAssetOwners() {
    return this.#showAssetOwners.current;
  }

  setShowAssetOwners(value: boolean) {
    this.#showAssetOwners.current = value;
  }

  toggleShowAssetOwners() {
    this.#showAssetOwners.current = !this.#showAssetOwners.current;
  }
}

export const albumSettingsManager = new AlbumSettingsManager();
