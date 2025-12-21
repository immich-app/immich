import { eventManager } from '$lib/managers/event-manager.svelte';

class SearchStore {
  savedSearchTerms = $state<string[]>([]);
  isSearchEnabled = $state(false);

  constructor() {
    eventManager.on('AuthLogout', () => this.clearCache());
    eventManager.on('AuthAccountSwitch', () => this.clearCache());
  }

  clearCache() {
    this.savedSearchTerms = [];
    this.isSearchEnabled = false;
  }
}

export const searchStore = new SearchStore();
