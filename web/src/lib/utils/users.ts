import { getUserFromStore, updateUserInStore, userExistsInStore } from '$lib/stores/users.store';
import { getUser, type UserResponseDto } from '@immich/sdk';

export const getUserAndCacheResult = async (userId: string, skipCache: boolean = false): Promise<UserResponseDto> => {
  let user: UserResponseDto;
  if (!skipCache && userExistsInStore(userId)) {
    user = getUserFromStore(userId)!;
  } else {
    //Add to store indicating a request to server is in-flight
    updateUserInStore({ userId });
    user = await getUser({ id: userId });
    //Update store with results of server request
    updateUserInStore({ user });
  }
  return user;
};
