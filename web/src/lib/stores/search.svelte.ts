import { eventManager } from '$lib/stores/event-manager.svelte';

class SearchStore {
  savedSearchTerms = $state<string[]>([]);
  isSearchEnabled = $state(false);

  constructor() {
    eventManager.on('auth.logout', () => this.clearCache());
  }

  clearCache() {
    this.savedSearchTerms = [];
    this.isSearchEnabled = false;
  }
}

export const searchStore = new SearchStore();
