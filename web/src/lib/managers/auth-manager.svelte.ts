import { goto } from '$app/navigation';
import { page } from '$app/state';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { isSharedLinkRoute } from '$lib/utils/navigation';
import { logout } from '@immich/sdk';

class AuthManager {
  key = $derived(isSharedLinkRoute(page.route?.id) ? page.params.key : undefined);

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

    redirectUri = redirectUri ?? AppRoute.AUTH_LOGIN;

    try {
      if (redirectUri.startsWith('/')) {
        await goto(redirectUri);
      } else {
        globalThis.location.href = redirectUri;
      }
    } finally {
      eventManager.emit('auth.logout');
    }
  }
}

export const authManager = new AuthManager();
