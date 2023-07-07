import { writable } from 'svelte/store';
import type { PersonResponseDto } from '@api';

export const mergeFacesStore = writable<Set<PersonResponseDto>>(new Set());
