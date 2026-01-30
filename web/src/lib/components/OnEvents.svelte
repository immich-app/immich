<script lang="ts">
  import { eventManager, type Events } from '$lib/managers/event-manager.svelte';
  import type { EventCallback, EventMap } from '$lib/utils/base-event-manager.svelte';
  import { onMount } from 'svelte';

  type Props = {
    [K in keyof Events as `on${K}`]?: (...args: Events[K]) => void;
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

    return eventManager.on(events);
  });
</script>
