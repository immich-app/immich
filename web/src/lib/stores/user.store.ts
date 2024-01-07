import { get, writable } from 'svelte/store';
import type { UserResponseDto } from '@api';
import { persisted } from 'svelte-local-storage-store';

export let user = writable<UserResponseDto>();

export const setUser = (value: UserResponseDto) => {
  user.set(value);
};

export const getSavedUser = () => {
  return get(user);
};

export const resetSavedUser = () => {
  user = writable<UserResponseDto>();
};

export const thumbnailsZoom = persisted<number>('thumbnails-zoom', 1, {});
