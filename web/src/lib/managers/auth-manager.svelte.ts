import { goto } from '$app/navigation';
import { page } from '$app/state';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { isSharedLinkRoute } from '$lib/utils/navigation';
import { getAboutInfo, logout, type UserAdminResponseDto } from '@immich/sdk';

class AuthManager {
  isPurchased = $state(false);
  isSharedLink = $derived(isSharedLinkRoute(page.route?.id));
  params = $derived(this.isSharedLink ? { key: page.params.key, slug: page.params.slug } : {});

  constructor() {
    eventManager.on({
      AuthUserLoaded: (user) => this.onAuthUserLoaded(user),
    });
  }

  private async onAuthUserLoaded(user: UserAdminResponseDto) {
    if (user.license?.activatedAt) {
      authManager.isPurchased = true;
      return;
    }

    const serverInfo = await getAboutInfo().catch(() => undefined);
    if (serverInfo?.licensed) {
      authManager.isPurchased = true;
    }
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

    redirectUri = redirectUri ?? Route.login();

    try {
      if (redirectUri.startsWith('/')) {
        await goto(redirectUri);
      } else {
        globalThis.location.href = redirectUri;
      }
    } finally {
      this.isPurchased = false;
      eventManager.emit('AuthLogout');
    }
  }
}

export const authManager = new AuthManager();
