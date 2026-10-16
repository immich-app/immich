import {
  deleteServerLicense,
  deleteUserLicense,
  getMyUser,
  getServerLicense,
  isHttpError,
  setServerLicense,
  setUserLicense,
  type LicenseResponseDto,
} from '@immich/sdk';
import { PUBLIC_IMMICH_BUY_HOST, PUBLIC_IMMICH_PAY_HOST } from '$env/static/public';
import { ImmichProduct } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { serverManager } from '$lib/managers/server-manager.svelte';

export type License = { type: ImmichProduct; licenseKey?: string; activatedAt?: string };

class LicenseManager {
  #serverLicense = $state<LicenseResponseDto>();
  #userLicense = $derived(authManager.authenticated ? authManager.user.license : undefined);

  license = $derived.by<License | undefined>(() => {
    if (this.#serverLicense) {
      return { type: ImmichProduct.Server, ...this.#serverLicense };
    }

    if (serverManager.about?.licensed) {
      return { type: ImmichProduct.Server };
    }

    if (this.#userLicense?.activatedAt) {
      return { type: ImmichProduct.Client, ...this.#userLicense };
    }
  });

  constructor() {
    eventManager.on({
      AuthLogout: () => this.reset(),
    });
  }

  async load() {
    await serverManager.ready();

    if (this.license) {
      await this.refresh();
    }
  }

  async activate(licenseKey: string, activationKey?: string | null) {
    const isServerActivation = authManager.user.isAdmin && licenseKey.includes('IMSV');
    const licenseKeyDto = { licenseKey, activationKey: activationKey || (await this.#getActivationKey(licenseKey)) };
    // Send server key to user activation if user is not admin
    const response = isServerActivation
      ? await setServerLicense({ licenseKeyDto })
      : await setUserLicense({ licenseKeyDto });

    await this.refresh();

    eventManager.emit('LicenseActivated');

    return response;
  }

  async refresh() {
    const [user] = await Promise.all([getMyUser(), serverManager.load()]);
    authManager.setUser(user);

    this.#serverLicense = user.isAdmin && serverManager.about?.licensed ? await this.#getServerLicense() : undefined;
  }

  async removeUserLicense() {
    await deleteUserLicense();
    authManager.setUser({ ...authManager.user, license: null });
  }

  async removeServerLicense() {
    await deleteServerLicense();
    this.#serverLicense = undefined;
    await serverManager.load();
  }

  reset() {
    this.#serverLicense = undefined;
  }

  async #getActivationKey(licenseKey: string) {
    const response = await fetch(new URL(`/api/v1/activate/${licenseKey}`, PUBLIC_IMMICH_PAY_HOST).href);
    if (!response.ok) {
      throw new Error('Failed to fetch activation key');
    }

    return response.text();
  }

  async #getServerLicense() {
    try {
      return await getServerLicense();
    } catch (error) {
      if (isHttpError(error) && error.status === 404) {
        return;
      }
      throw error;
    }
  }

  asHref(product: ImmichProduct) {
    const url = new URL('/', PUBLIC_IMMICH_BUY_HOST);
    url.searchParams.append('productId', product);
    url.searchParams.append('instanceUrl', serverConfigManager.value.externalDomain || globalThis.origin);
    return url.href;
  }
}

export const licenseManager = new LicenseManager();
