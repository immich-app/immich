import { browser } from '$app/environment';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { user as user$ } from '$lib/stores/user.store';
import { getMyUser } from '@server/sdk';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export interface AuthOptions {
  admin?: true;
  public?: boolean;
}

export const loadUser = async () => {
  try {
    let user = get(user$);

    if (!user && hasAuthCookie()) {
      user = await getMyUser();
      user$.set(user);

      eventManager.emit('AuthUserLoaded', user);
    }
    return user;
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

export const authenticate = async (url: URL, options?: AuthOptions) => {
  const { public: publicRoute, admin: adminRoute } = options || {};
  const user = await loadUser();

  if (publicRoute) {
    return;
  }

  if (!user) {
    redirect(307, Route.login({ continue: url.pathname + url.search }));
  }

  if (adminRoute && !user.isAdmin) {
    redirect(307, Route.userSettings());
  }
};
