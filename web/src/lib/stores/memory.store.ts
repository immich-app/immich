import type { MemoryLaneResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const memoryStore = writable<MemoryLaneResponseDto[]>();
