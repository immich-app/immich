<script lang="ts">
  import { assetViewerManager, type Events } from '$lib/managers/asset-viewer-manager.svelte';
  import type { EventCallback } from '$lib/utils/base-event-manager.svelte';
  import { onMount } from 'svelte';

  type Props = {
    [K in keyof Events as `on${K}`]?: EventCallback<Events, K>;
  };

  const props: Props = $props();

  onMount(() => {
    const unsubscribes: Array<() => void> = [];

    for (const name of Object.keys(props)) {
      const event = name.slice(2) as keyof Events;
      const listener = props[name as keyof Props] as EventCallback<Events, typeof event> | undefined;
      if (!listener) {
        continue;
      }

      unsubscribes.push(assetViewerManager.on(event, listener));
    }

    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  });
</script>
