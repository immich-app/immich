import { type UserAdminResponseDto, type UserPreferencesResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const user = writable<UserAdminResponseDto>();
export const preferences = writable<UserPreferencesResponseDto>();

/**
 * Reset the store to its initial undefined value. Make sure to
 * only do this _after_ redirecting to an unauthenticated page.
 */
export const resetSavedUser = () => {
  user.set(undefined as unknown as UserAdminResponseDto);
  preferences.set(undefined as unknown as UserPreferencesResponseDto);
};
