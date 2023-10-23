import { persisted } from 'svelte-local-storage-store';
import { writable } from 'svelte/store';

export const savedSearchTerms = persisted<string[]>('search-terms', [], {});
export const isSearchEnabled = writable<boolean>(false);
export const preventRaceConditionSearchBar = writable<boolean>(false);
