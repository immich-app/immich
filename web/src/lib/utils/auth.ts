import { api } from '@api';
import { redirect } from '@sveltejs/kit';
import { AppRoute } from '../constants';
import { getSavedUser, setUser } from '$lib/stores/user.store';

export interface AuthOptions {
  admin?: true;
}

export const getAuthUser = async () => {
  try {
    const { data: user } = await api.userApi.getMyUserInfo();
    return user;
  } catch {
    return null;
  }
};

// TODO: re-use already loaded user (once) instead of fetching on each page navigation
export const authenticate = async (options?: AuthOptions) => {
  options = options || {};

  const savedUser = getSavedUser();
  const user = savedUser || (await getAuthUser());

  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  if (options.admin && !user.isAdmin) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  if (!savedUser) {
    setUser(user);
  }
};

export const isLoggedIn = async () => {
  const savedUser = getSavedUser();
  const user = savedUser || (await getAuthUser());
  if (!savedUser) {
    setUser(user);
  }
  return user;
};
