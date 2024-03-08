import type { UserResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const user = writable<UserResponseDto>();

/**
 * Reset the store to its initial undefined value. Make sure to
 * only do this _after_ redirecting to an unauthenticated page.
 */
export const resetSavedUser = () => {
  user.set(undefined as unknown as UserResponseDto);
};
