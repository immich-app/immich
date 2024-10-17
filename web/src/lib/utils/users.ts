import { getUserFromStore, updateUserInStore, userExistsInStore } from '$lib/stores/users.store';
import { getUser, type UserResponseDto } from '@immich/sdk';

export const getUserAndCacheResult = async (userId: string, skipCache: boolean = false): Promise<UserResponseDto> => {
  let user: UserResponseDto | Promise<UserResponseDto>;
  if (!skipCache && userExistsInStore(userId)) {
    user = getUserFromStore(userId)!;
    return user;
  } else {
    //Add to store indicating a request to server is in-flight
    const userRequest = getUser({ id: userId }).then((user) => {
      updateUserInStore({ user });
      return user;
    });
    updateUserInStore({ userId, userRequest });
    return userRequest;
  }
};
