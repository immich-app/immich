import type { UserResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export let user = writable<UserResponseDto>();

export const resetSavedUser = () => {
  user = writable<UserResponseDto>();
};
