import { writable } from 'svelte/store';
import type { MemoryLaneResponseDto } from '../../api/open-api';

export const memoryStore = writable<MemoryLaneResponseDto[]>();
