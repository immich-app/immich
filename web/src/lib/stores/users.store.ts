import { type UserResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const users = writable<{ [key: string]: UserResponseDto | Promise<UserResponseDto> }>({});

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

export const updateUserInStore = ({
  user,
  userId,
  userRequest,
}: {
  user?: UserResponseDto;
  userId?: string;
  userRequest?: Promise<UserResponseDto>;
}) => {
  users.update((userStore) => {
    if (user) {
      userStore[user.id] = user;
    } else if (userId && userRequest) {
      userStore[userId] = userRequest;
    }
    return userStore;
  });
};

export const getUserFromStore = (userId: string): UserResponseDto | Promise<UserResponseDto> => {
  let userInfo: UserResponseDto | Promise<UserResponseDto> | undefined;
  users.subscribe((userStore) => {
    userInfo = userStore[userId];
  })();
  if (userInfo === undefined) {
    throw 'UserId not found';
  }
  return userInfo;
};
