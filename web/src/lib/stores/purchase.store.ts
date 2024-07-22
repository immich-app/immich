import { writable } from 'svelte/store';

function createPurchaseStore() {
  const isPurcharsed = writable(false);

  function setPurchaseStatus(status: boolean) {
    isPurcharsed.set(status);
  }

  return {
    isPurchased: {
      subscribe: isPurcharsed.subscribe,
    },
    setPurchaseStatus,
  };
}

export const purchaseStore = createPurchaseStore();
