import { type UserResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const users = writable<{ [key: string]: UserResponseDto | undefined }>({});

export const userExistsInStore = (userId: string): boolean => {
  let exists = false;
  users.subscribe((userStore) => {
    try {
      exists = userId in userStore;
    } catch {
      exists = false;
    }
  })();
  return exists;
};

export const updateUserInStore = ({ user, userId }: { user?: UserResponseDto; userId?: string }) => {
  users.update((userStore) => {
    if (user) {
      userStore[user.id] = user;
    } else if (userId) {
      userStore[userId] = undefined;
    }
    return userStore;
  });
};

export const getUserFromStore = (userId: string): UserResponseDto | undefined => {
  let userInfo: UserResponseDto | undefined;
  users.subscribe((userStore) => {
    userInfo = userStore[userId];
  })();
  return userInfo;
};
