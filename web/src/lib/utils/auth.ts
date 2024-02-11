import { api } from '@api';
import { redirect } from '@sveltejs/kit';
import { AppRoute } from '../constants';
import { get } from 'svelte/store';
import { serverInfo } from '$lib/stores/server-info.store';
import { browser } from '$app/environment';
import { user } from '$lib/stores/user.store';

export interface AuthOptions {
  admin?: true;
  public?: true;
}

export const loadUser = async () => {
  try {
    if (!get(user) && hasAuthCookie()) {
      const { data } = await api.userApi.getMyUserInfo();
      user.set(data);
    }
    return get(user);
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

  if (options.public) {
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
  if (get(user)) {
    const { data } = await api.serverInfoApi.getServerInfo();
    serverInfo.set(data);
  }
};
