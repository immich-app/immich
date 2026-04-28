import { authManager } from '$lib/managers/auth-manager.svelte';
import { Route } from '$lib/route';
import { userInteraction } from '$lib/stores/user.svelte';
import { getStorage } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { DateTime } from 'luxon';

export interface AuthOptions {
  admin?: true;
  public?: boolean;
}

export const authenticate = async (url: URL, options?: AuthOptions) => {
  const { public: publicRoute, admin: adminRoute } = options || {};
  await authManager.load();

  if (publicRoute) {
    return;
  }

  if (!authManager.authenticated) {
    redirect(307, Route.login({ continue: url.pathname + url.search }));
  }

  if (adminRoute && !authManager.user.isAdmin) {
    redirect(307, Route.photos());
  }
};

export const requestServerInfo = async () => {
  if (authManager.authenticated) {
    const data = await getStorage();
    userInteraction.serverInfo = data;
  }
};

export const getAccountAge = (): number => {
  if (!authManager.authenticated) {
    return 0;
  }

  const createdDate = DateTime.fromISO(authManager.user.createdAt);
  const now = DateTime.now();
  const accountAge = now.diff(createdDate, 'days').days.toFixed(0);

  return Number(accountAge);
};
