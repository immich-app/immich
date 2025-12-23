import { eventManager } from '$lib/managers/event-manager.svelte';
import { type ReleaseEvent } from '$lib/types';

class ReleaseManager {
  value = $state<ReleaseEvent | undefined>();

  constructor() {
    eventManager.on('ReleaseEvent', (event) => (this.value = event));
  }
}

export const releaseManager = new ReleaseManager();
