import { api } from '@api';
import { redirect } from '@sveltejs/kit';
import { AppRoute } from '../constants';
import { currentUser, setUser } from '$lib/stores/user.store';
import { serverInfo } from '$lib/stores/server-info.store';
import { browser } from '$app/environment';

export interface AuthOptions {
  admin?: true;
  public?: true;
}

export const loadUser = async () => {
  try {
    const user = currentUser();
    if (!user && hasAuthCookie()) {
      const { data } = await api.userApi.getMyUserInfo();
      setUser(data);
    }
    return currentUser();
  } catch {
    return undefined;
  }
};

const hasAuthCookie = (): boolean => {
  if (browser) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [name] = cookie.split('=');
      if (name === 'immich_is_authenticated') {
        return true;
      }
    }
  }
  return false;
};

export const authenticate = async (options?: AuthOptions) => {
  options = options || {};
  const user = await loadUser();

  if (options.public && !user) {
    return;
  }

  if (options.admin && user && !user.isAdmin) {
    redirect(302, AppRoute.PHOTOS);
  }

  if (!options.public && !user) {
    redirect(302, AppRoute.AUTH_LOGIN);
  }
};

export const requestServerInfo = async () => {
  if (currentUser()) {
    const { data } = await api.serverInfoApi.getServerInfo();
    serverInfo.set(data);
  }
};
