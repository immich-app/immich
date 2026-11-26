import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import type { LoginResponseDto } from '@immich/sdk';
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

export const getAccountAge = (): number => {
  if (!authManager.authenticated) {
    return 0;
  }

  const createdDate = DateTime.fromISO(authManager.user.createdAt);
  const now = DateTime.now();
  const accountAge = now.diff(createdDate, 'days').days.toFixed(0);

  return Number(accountAge);
};

export const getFirstLoginRoute = (
  user: LoginResponseDto,
  { isServerOnboarded, passwordLoginEnabled }: { isServerOnboarded: boolean; passwordLoginEnabled: boolean },
) => {
  if (user.isAdmin && !isServerOnboarded) {
    return Route.onboarding();
  }

  // change the user password before we onboard them
  if (!user.isAdmin && user.shouldChangePassword && passwordLoginEnabled) {
    return Route.changePassword();
  }

  // We want to onboard after the first login since their password will change
  // and handleLogin will be called again (relogin). We then do onboarding on that next call.
  if (!user.isOnboarded) {
    return Route.onboarding();
  }
};
