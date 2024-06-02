import { get, writable } from 'svelte/store';

function createIdStore() {
  const { subscribe, update } = writable(-1);

  return {
    subscribe,
    update,
    generateId: () => {
      update((value) => value + 1);
      return `id-${get(uniqueIdStore)}`;
    },
  };
}

export const uniqueIdStore = createIdStore();
