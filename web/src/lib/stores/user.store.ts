import { get, writable } from 'svelte/store';
import type { UserResponseDto } from '@api';

export const savedUser = writable<UserResponseDto | null>(null);

export const user = writable<UserResponseDto>();

export const setUser = (value: UserResponseDto | null) => {
  if (value) {
    user.set(value);
  }

  savedUser.set(value);
};

export const getSavedUser = () => {
  return get(savedUser);
};
