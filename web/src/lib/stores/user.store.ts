import { writable } from 'svelte/store';
import type { UserResponseDto } from '@api';

export const user = writable<UserResponseDto | null>(null);

export const setUser = (value: UserResponseDto) => {
  user.set(value);
};
