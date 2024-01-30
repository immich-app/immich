import { get, writable } from 'svelte/store';
import type { UserResponseDto } from '@api';

export let user = writable<UserResponseDto>();

export const setUser = (value: UserResponseDto) => {
  user.set(value);
};

export const currentUser = () => {
  return get(user);
};

export const resetSavedUser = () => {
  user = writable<UserResponseDto>();
};
