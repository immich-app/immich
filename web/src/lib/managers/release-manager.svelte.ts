import type { ReleaseEventV1 } from '@immich/sdk';
import { eventManager } from '$lib/managers/event-manager.svelte';

class ReleaseManager {
  value = $state<ReleaseEventV1 | undefined>();

  constructor() {
    eventManager.on({
      ReleaseEvent: (event) => (this.value = event),
    });
  }
}

export const releaseManager = new ReleaseManager();
