import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import type { ReleaseEventV1 } from '@immich/sdk';

class ReleaseManager {
  value = $state<ReleaseEventV1 | undefined>();

  constructor() {
    eventManager.on({
      ReleaseEvent: (event) => (this.value = event),
    });
  }
}

export const releaseManager = new ReleaseManager();
