import {
  getAboutInfo,
  getAuthStatus,
  getMyPreferences,
  getMyUser,
  logout,
  type UserAdminResponseDto,
  type UserPreferencesResponseDto,
} from '@immich/sdk';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { isSharedLinkRoute } from '$lib/utils/navigation';

class AuthManager {
  isPurchased = $state(false);
  isSharedLink = $derived(isSharedLinkRoute(page.route?.id));
  params = $derived(this.isSharedLink ? { key: page.params.key, slug: page.params.slug } : {});
  // Whether the current session currently has elevated (PIN-verified) access. Used to decide,
  // client-side, whether to attempt loading a locked album's real thumbnail or show a lock icon
  // placeholder instead. This does not grant or check any access itself -- the server remains
  // the source of truth and denies unauthorized requests regardless of this flag's value.
  isElevated = $state(false);

  #user = $state<UserAdminResponseDto>();
  #preferences = $state<UserPreferencesResponseDto>();
  // Timer that flips isElevated back to false the moment the server-side PIN elevation window
  // closes, so thumbnails fall back to the lock icon on their own instead of staying stuck in a
  // stale "elevated" state (and failing real thumbnail requests) until the next navigation.
  #elevationExpiryTimer: ReturnType<typeof setTimeout> | undefined;

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

  async refreshElevation() {
    try {
      const { isElevated, pinExpiresAt } = await getAuthStatus();
      this.isElevated = isElevated;
      this.#scheduleElevationExpiry(isElevated ? pinExpiresAt : undefined);
    } catch {
      // noop
    }
  }

  // How long before the known expiry to re-check with the server instead of trusting it blindly.
  // This is what picks up the server's sliding-renewal extension (active elevated use pushes
  // pinExpiresAt further out) without needing to re-check after every single request -- one
  // cheap re-check per elevation window is enough, not one per thumbnail/click.
  static #RECHECK_BUFFER_MS = 30_000;

  #scheduleElevationExpiry(pinExpiresAt: string | undefined) {
    clearTimeout(this.#elevationExpiryTimer);
    this.#elevationExpiryTimer = undefined;

    if (!pinExpiresAt) {
      return;
    }

    const msUntilExpiry = new Date(pinExpiresAt).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      this.isElevated = false;
      return;
    }

    const hasRoomToRecheck = msUntilExpiry > AuthManager.#RECHECK_BUFFER_MS;
    const delay = hasRoomToRecheck ? msUntilExpiry - AuthManager.#RECHECK_BUFFER_MS : msUntilExpiry;

    // setTimeout's delay is a 32-bit signed int (~24.8 days max) -- the 15-minute elevation
    // window is nowhere close to that, but guard against absurd/clock-skewed values regardless.
    this.#elevationExpiryTimer = setTimeout(
      () => {
        if (hasRoomToRecheck) {
          // Ask the server for the current status instead of assuming expiry -- if the window
          // was extended (sliding renewal) since our last check, this picks up the new expiry
          // and reschedules against it rather than flipping to "locked" prematurely.
          void this.refreshElevation();
        } else {
          this.isElevated = false;
        }
      },
      Math.min(delay, 2_147_483_647),
    );
  }

  async refresh() {
    try {
      const [user, preferences] = await Promise.all([getMyUser(), getMyPreferences()]);
      this.#preferences = preferences;
      this.#user = user;
      void this.refreshElevation();

      if (user.license?.activatedAt) {
        this.isPurchased = true;
      } else {
        // check server status
        const serverInfo = await getAboutInfo().catch(() => {});
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
    this.isElevated = false;
    clearTimeout(this.#elevationExpiryTimer);
    this.#elevationExpiryTimer = undefined;
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
