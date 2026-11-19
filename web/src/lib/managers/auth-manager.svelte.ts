import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getAdminConfigQuery } from '#lib/queries/config-admin.query.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getAboutInfoQuery } from '#lib/queries/server-info.query.ts';
import { getMyPreferencesQuery, getMyUserQuery } from '#lib/queries/user.query.ts';
import { Route } from '#lib/route.ts';
import { isSharedLinkRoute } from '#lib/utils/navigation.ts';
import { logout, type UserAdminResponseDto, type UserPreferencesResponseDto } from '@immich/sdk';
import { hashKey } from '@tanstack/svelte-query';
import { browser } from '$app/env';
import { goto } from '$app/navigation';
import { page } from '$app/state';

class AuthManager {
  isSharedLink = $derived(isSharedLinkRoute(page.route?.id));
  params = $derived(this.isSharedLink ? { key: page.params.key, slug: page.params.slug } : {});

  #cacheVersion = $state(0);
  #trackedQueryHashes = new Set(
    [QueryKeys.myUser(), QueryKeys.myPreferences(), QueryKeys.serverAbout()].map((queryKey) => hashKey(queryKey)),
  );

  get #user() {
    void this.#cacheVersion;
    return queryClient.getQueryData(getMyUserQuery().queryKey);
  }

  get #preferences() {
    void this.#cacheVersion;
    return queryClient.getQueryData(getMyPreferencesQuery().queryKey);
  }

  get isPurchased() {
    return !!this.#user?.license?.activatedAt || !!queryClient.getQueryData(getAboutInfoQuery().queryKey)?.licensed;
  }

  get authenticated() {
    return !!(this.#user && this.#preferences);
  }

  get user() {
    if (!this.#user) {
      throw new TypeError('AuthManager.user is undefined');
    }

    return this.#user;
  }

  get preferences() {
    if (!this.#preferences) {
      throw new TypeError('AuthManager.preferences is undefined');
    }

    return this.#preferences;
  }

  constructor() {
    eventManager.on({
      SessionDelete: () => goto(Route.logout()),
    });
    queryClient.getQueryCache().subscribe((event) => {
      const isDataChange = event.type === 'removed' || (event.type === 'updated' && event.action.type === 'success');
      if (isDataChange && this.#trackedQueryHashes.has(event.query.queryHash)) {
        this.#cacheVersion++;
      }
    });
  }

  async load() {
    if (authManager.authenticated) {
      return;
    }

    if (!this.#hasAuthCookie()) {
      return;
    }

    try {
      const [user] = await Promise.all([
        queryClient.query(getMyUserQuery()),
        queryClient.query(getMyPreferencesQuery()),
        queryClient.query(getUserConfigQuery()),
      ]);
      if (user.isAdmin) {
        await queryClient.query(getAdminConfigQuery());
      }

      if (!user.license?.activatedAt) {
        await queryClient.query(getAboutInfoQuery()).catch(() => {});
      }

      eventManager.emit('AuthUserLoaded', user);
    } catch {
      // noop
    }
  }

  setUser(user: UserAdminResponseDto) {
    queryClient.setQueryData(getMyUserQuery().queryKey, user);
  }

  setPreferences(preferences: UserPreferencesResponseDto) {
    queryClient.setQueryData(getMyPreferencesQuery().queryKey, preferences);
  }

  async logout() {
    let redirectUri = Route.login();

    try {
      const response = await logout();
      if (response.redirectUri) {
        redirectUri = response.redirectUri;
      }
    } catch {
      // noop
    }

    if (redirectUri.startsWith('/')) {
      eventManager.emit('AuthLogout');

      await goto(redirectUri);
    } else {
      location.assign(redirectUri);
    }
  }

  #hasAuthCookie() {
    if (!browser) {
      return;
    }

    for (const cookie of document.cookie.split('; ')) {
      const [name] = cookie.split('=', 1);
      if (name === 'immich_is_authenticated') {
        return true;
      }
    }

    return false;
  }
}

export const authManager = new AuthManager();
