import { goto } from '$app/navigation';
import { page } from '$app/state';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { clearAuthHeader, switchToAccount as switchToAccountUtil } from '$lib/utils/auth';
import { isSharedLinkRoute } from '$lib/utils/navigation';
import { logout } from '@immich/sdk';

class AuthManager {
  isSharedLink = $derived(isSharedLinkRoute(page.route?.id));
  params = $derived(this.isSharedLink ? { key: page.params.key, slug: page.params.slug } : {});

  /**
   * Switch to a different saved account
   * @param accountId The ID of the account to switch to
   * @returns true if switch was successful, false if the session is invalid/expired
   */
  async switchToAccount(accountId: string): Promise<boolean> {
    const success = await switchToAccountUtil(accountId);

    if (success) {
      globalThis.location.href = AppRoute.PHOTOS;
    }

    return success;
  }

  async logout() {
    let redirectUri;

    try {
      const response = await logout();
      if (response.redirectUri) {
        redirectUri = response.redirectUri;
      }
    } catch (error) {
      console.log('Error logging out:', error);
    }

    clearAuthHeader();

    redirectUri = redirectUri ?? AppRoute.AUTH_LOGIN;

    try {
      if (redirectUri.startsWith('/')) {
        await goto(redirectUri);
      } else {
        globalThis.location.href = redirectUri;
      }
    } finally {
      eventManager.emit('AuthLogout');
    }
  }
}

export const authManager = new AuthManager();
