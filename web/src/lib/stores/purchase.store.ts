import { readonly, writable } from 'svelte/store';

function createPurchaseStore() {
  const isPurcharsed = writable(false);

  function setPurchaseStatus(status: boolean) {
    isPurcharsed.set(status);
  }

  return {
    isPurchased: readonly(isPurcharsed),
    setPurchaseStatus,
  };
}

export const purchaseStore = createPurchaseStore();
