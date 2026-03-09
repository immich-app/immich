<script lang="ts">
  import { assetViewerManager, type Events } from '$lib/managers/asset-viewer-manager.svelte';
  import type { EventCallback, EventMap } from '$lib/utils/base-event-manager.svelte';
  import { onMount } from 'svelte';

  type Props = {
    [K in keyof Events as `on${K}`]?: EventCallback<Events, K>;
  };

  const props: Props = $props();

  onMount(() => {
    const events: EventMap<Events> = {};

    for (const [name, listener] of Object.entries(props)) {
      if (listener) {
        const event = name.slice(2) as keyof Events;
        events[event] = listener as EventCallback<Events, typeof event>;
      }
    }

    return assetViewerManager.on(events);
  });
</script>
