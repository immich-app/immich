import { get, writable } from 'svelte/store';
import type { UserResponseDto } from '@api';

export const user = writable<UserResponseDto | null>(null);

export const setUser = (value: UserResponseDto | null) => {
  user.set(value);
};

export const getSavedUser = () => {
  return get(user);
};
