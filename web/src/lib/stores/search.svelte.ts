import { eventManager } from '#lib/managers/event-manager.svelte.js';

class SearchStore {
  savedSearchTerms = $state<string[]>([]);
  isSearchEnabled = $state(false);

  constructor() {
    eventManager.on({
      AuthLogout: () => this.clearCache(),
    });
  }

  clearCache() {
    this.savedSearchTerms = [];
    this.isSearchEnabled = false;
  }
}

export const searchStore = new SearchStore();
