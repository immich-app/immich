import { asLocalTimeISO } from '$lib/utils/date-time';
import { searchMemories, type MemoryResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';
import { writable } from 'svelte/store';

export const memoryStore = writable<MemoryResponseDto[]>();

export const loadMemories = async () => {
  const memories = await searchMemories({ $for: asLocalTimeISO(DateTime.now()) });
  memoryStore.set(memories);
};
