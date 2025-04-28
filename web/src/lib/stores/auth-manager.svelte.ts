import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/stores/event-manager.svelte';
import { logout } from '@immich/sdk';

class AuthManager {
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
