import type { UserResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const user = writable<UserResponseDto & { loggedOut?: true }>();

export const resetSavedUser = () => {
  user.update((value) => {
    if (value) {
      value.loggedOut = true;
    }
    return value;
  });
};
