import { api } from '@api';
import { redirect } from '@sveltejs/kit';
import { AppRoute } from '../constants';

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

  const user = await getAuthUser();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  if (options.admin && !user.isAdmin) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  return user;
};

export const isLoggedIn = async () => getAuthUser().then((user) => !!user);
