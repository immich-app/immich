import { writable } from 'svelte/store';
import { persisted } from 'svelte-local-storage-store';

export const enableClip = writable<boolean>(false);
export const savedSearchTerms = persisted<string[]>('search-terms', [], {});
