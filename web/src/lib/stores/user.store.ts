import { writable } from 'svelte/store';
import type { UserResponseDto } from '@api';

export let user = writable<UserResponseDto>();

export const resetSavedUser = () => {
  user = writable<UserResponseDto>();
};
