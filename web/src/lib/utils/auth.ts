import { api } from '@api';
import { redirect } from '@sveltejs/kit';
import { AppRoute } from '../constants';
import { serverInfo } from '$lib/stores/server-info.store';
import { getSavedUser, setUser } from '$lib/stores/user.store';
import { getAuthCookie } from './cookies';

export interface AuthOptions {
  admin?: true;
  public?: true;
}

export const getAuthUser = async () => {
  try {
    const { data: user } = await api.userApi.getMyUserInfo();
    return user;
  } catch {
    return null;
  }
};

export const authenticate = async (options?: AuthOptions) => {
  options = options || {};
  const isAuthenticated = getAuthCookie() === 'true';

  const savedUser = getSavedUser();
  const user = savedUser || isAuthenticated ? await getAuthUser() : null;
  if (!options.public) {
    if (!user) {
      redirect(302, AppRoute.AUTH_LOGIN);
    }
    if (options.admin && !user.isAdmin) {
      redirect(302, AppRoute.PHOTOS);
    }
  }
  if (!savedUser && user) {
    setUser(user);
  }
};

export const requestServerInfo = async () => {
  if (getSavedUser()) {
    const { data } = await api.serverInfoApi.getServerInfo();
    serverInfo.set(data);
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
