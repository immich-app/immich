import { eventManager } from '$lib/managers/event-manager.svelte';

class SearchStore {
  currentSearchTerm = $state<string>('');
  savedSearchTerms = $state<string[]>([]);
  isSearchEnabled = $state(false);

  constructor() {
    eventManager.on('auth.logout', () => this.clearCache());
  }

  clearCache() {
    this.currentSearchTerm = '';
    this.savedSearchTerms = [];
    this.isSearchEnabled = false;
  }
}

export const searchStore = new SearchStore();
