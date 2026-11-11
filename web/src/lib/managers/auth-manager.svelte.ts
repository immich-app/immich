import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getAdminConfigQuery } from '#lib/queries/config-admin.query.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { getAboutInfoQuery } from '#lib/queries/server-info.query.ts';
import { Route } from '#lib/route.ts';
import { isSharedLinkRoute } from '#lib/utils/navigation.ts';
import {
  getMyPreferences,
  getMyUser,
  logout,
  type UserAdminResponseDto,
  type UserPreferencesResponseDto,
} from '@immich/sdk';
import { browser } from '$app/env';
import { goto } from '$app/navigation';
import { page } from '$app/state';

class AuthManager {
  isPurchased = $state(false);
  isSharedLink = $derived(isSharedLinkRoute(page.route?.id));
  params = $derived(this.isSharedLink ? { key: page.params.key, slug: page.params.slug } : {});

  #user = $state<UserAdminResponseDto>();
  #preferences = $state<UserPreferencesResponseDto>();

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
  }

  async load() {
    if (authManager.authenticated) {
      return;
    }

    if (!this.#hasAuthCookie()) {
      return;
    }

    return this.refresh();
  }

  async refresh() {
    try {
      const [user, preferences] = await Promise.all([
        getMyUser(),
        getMyPreferences(),
        queryClient.query(getUserConfigQuery()),
      ]);
      if (user.isAdmin) {
        await queryClient.query(getAdminConfigQuery());
      }
      this.#preferences = preferences;
      this.#user = user;

      if (user.license?.activatedAt) {
        this.isPurchased = true;
      } else {
        // check server status
        const serverInfo = await queryClient.query(getAboutInfoQuery()).catch(() => {});
        if (serverInfo?.licensed) {
          this.isPurchased = true;
        }
      }

      eventManager.emit('AuthUserLoaded', user);
    } catch {
      // noop
    }
  }

  setUser(user: UserAdminResponseDto) {
    this.#user = user;
  }

  setPreferences(preferences: UserPreferencesResponseDto) {
    this.#preferences = preferences;
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
      this.isPurchased = false;

      this.reset();
      eventManager.emit('AuthLogout');

      await goto(redirectUri);
    } else {
      location.assign(redirectUri);
    }
  }

  reset() {
    this.#user = undefined;
    this.#preferences = undefined;
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
