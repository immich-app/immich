import { writable } from 'svelte/store';
import type { MemoryLaneResponseDto } from '@api';

export const memoryStore = writable<MemoryLaneResponseDto[]>();
