class SearchStore {
  savedSearchTerms = $state<string[]>([]);
  isSearchEnabled = $state(false);
  preventRaceConditionSearchBar = $state(false);

  clearCache() {
    this.savedSearchTerms = [];
    this.isSearchEnabled = false;
    this.preventRaceConditionSearchBar = false;
  }
}

export const searchStore = new SearchStore();
