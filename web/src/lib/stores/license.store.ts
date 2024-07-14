import { writable } from 'svelte/store';

function createLicenseStore() {
  const isLicenseActivated = writable(false);

  function setLicenseStatus(status: boolean) {
    isLicenseActivated.set(status);
  }

  return {
    isLicenseActivated: {
      subscribe: isLicenseActivated.subscribe,
    },
    setLicenseStatus,
  };
}

export const licenseStore = createLicenseStore();
