import { goto } from '$app/navigation';
import { page } from '$app/state';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { user as user$ } from '$lib/stores/user.store';
import { clearAuthHeader, switchToAccount as switchToAccountUtil } from '$lib/utils/auth';
import { isSharedLinkRoute } from '$lib/utils/navigation';
import { logout } from '@immich/sdk';
import { get } from 'svelte/store';

class AuthManager {
  isSharedLink = $derived(isSharedLinkRoute(page.route?.id));
  params = $derived(this.isSharedLink ? { key: page.params.key, slug: page.params.slug } : {});

  /**
   * Switch to a different saved account
   * @param accountId The ID of the account to switch to
   * @returns true if switch was successful, false if the session is invalid/expired
   */
  async switchToAccount(accountId: string): Promise<boolean> {
    const previousUser = get(user$);
    const previousUserId = previousUser?.id ?? '';

    const success = await switchToAccountUtil(accountId);

    if (success) {
      const newUser = get(user$);
      const newUserId = newUser?.id ?? '';

      // Emit the account switch event
      eventManager.emit('AuthAccountSwitch', { previousUserId, newUserId });

      // Navigate to photos page after successful switch
      await goto(AppRoute.PHOTOS, { invalidateAll: true });
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

    // Clear any auth headers set for account switching
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
