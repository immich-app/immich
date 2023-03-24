import { persisted } from 'svelte-local-storage-store';

export const savedSearchTerms = persisted<string[]>('search-terms', [], {});
