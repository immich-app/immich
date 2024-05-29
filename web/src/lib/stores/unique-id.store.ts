import { get, writable } from 'svelte/store';

function createIdStore() {
  const { subscribe, update } = writable(0);

  return {
    subscribe,
    generateId: () => {
      update((value) => value + 1);
      return `id-${get(uniqueIdStore)}`;
    },
  };
}

export const uniqueIdStore = createIdStore();
