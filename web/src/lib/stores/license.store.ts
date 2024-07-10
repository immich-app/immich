import { getAboutInfo, getServerLicense, getUserLicense, setUserLicense } from '@immich/sdk';
import { writable } from 'svelte/store';

function createLicenseStore() {
  const isLicenseActivated = writable(false);

  async function getLicenseStatus() {
    const serverInfo = await getAboutInfo();
    if (serverInfo.licensed) {
      isLicenseActivated.set(true);
      return;
    }

    const userLicense = await getUserLicense();
    if (userLicense.activatedAt) {
      isLicenseActivated.set(true);
      return;
    }

    isLicenseActivated.set(false);
  }

  async function setLicenseStatus(status: boolean) {
    isLicenseActivated.set(status);
  }

  return {
    isLicenseActivated: {
      subscribe: isLicenseActivated.subscribe,
    },
    getLicenseStatus,
    setLicenseStatus,
  };
}

export const licenseStore = createLicenseStore();
