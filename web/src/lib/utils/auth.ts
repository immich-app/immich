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
    let loaded = get(user);
    if (!loaded && hasAuthCookie()) {
      const { data } = await api.userApi.getMyUserInfo();
      loaded = data;
      user.set(loaded);
    }
    return loaded;
  } catch {
    return null;
  }
};

const hasAuthCookie = (): boolean => {
  if (!browser) {
    return false;
  }

  for (const cookie of document.cookie.split('; ')) {
    const [name] = cookie.split('=');
    if (name === 'immich_is_authenticated') {
      return true;
    }
  }

  return false;
};

export const authenticate = async (options?: AuthOptions) => {
  const { public: publicRoute, admin: adminRoute } = options || {};
  const user = await loadUser();

  if (publicRoute) {
    return;
  }

  if (!user) {
    redirect(302, AppRoute.AUTH_LOGIN);
  }

  if (adminRoute && !user.isAdmin) {
    redirect(302, AppRoute.PHOTOS);
  }
};

export const requestServerInfo = async () => {
  if (get(user)) {
    const { data } = await api.serverInfoApi.getServerInfo();
    serverInfo.set(data);
  }
};
