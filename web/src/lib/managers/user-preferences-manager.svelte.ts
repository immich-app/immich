import { isEqual } from 'lodash-es';
import { PersistedLocalStorage } from '$lib/utils/persisted';

export type MemoriesPreferences = {
  showUpcoming: boolean;
  onlyFavorites: boolean;
};

class UserPreferencesManager {
  #castReceiverAppId = new PersistedLocalStorage<string>('cast-receiver-app-id', '');

  get castReceiverAppId() {
    return this.#castReceiverAppId.current;
  }

  set castReceiverAppId(value: string) {
    this.#castReceiverAppId.current = value.trim();
  }

  #showDetailPanel = new PersistedLocalStorage<boolean>('asset-viewer-state', false);
  #showAssetPath = new PersistedLocalStorage<boolean>('asset-viewer-show-path', false);
  #showAssetOwners = new PersistedLocalStorage<boolean>('album-show-asset-owners', false);
  #defaultMemories: MemoriesPreferences = { showUpcoming: false, onlyFavorites: false };
  #memories = new PersistedLocalStorage<MemoriesPreferences>(
    'memories-settings',
    { ...this.#defaultMemories },
    {
      upgrade: 'merge',
    },
  );

  get showDetailPanel() {
    return this.#showDetailPanel.current;
  }

  set showDetailPanel(value: boolean) {
    this.#showDetailPanel.current = value;
  }

  get showAssetPath() {
    return this.#showAssetPath.current;
  }

  set showAssetPath(value: boolean) {
    this.#showAssetPath.current = value;
  }

  get showAssetOwners() {
    return this.#showAssetOwners.current;
  }

  set showAssetOwners(value: boolean) {
    this.#showAssetOwners.current = value;
  }

  get memories() {
    return this.#memories.current;
  }

  set memories(value: MemoriesPreferences) {
    this.#memories.current = value;
  }

  hasMemoryPreferences() {
    return !isEqual(this.memories, this.#defaultMemories);
  }
}

export const userPreferencesManager = new UserPreferencesManager();
