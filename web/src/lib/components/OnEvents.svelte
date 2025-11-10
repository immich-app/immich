<script lang="ts">
  import { eventManager, type Events } from '$lib/managers/event-manager.svelte';
  import { onMount } from 'svelte';

  type Props = Partial<{
    [K in keyof Events as `on${K}`]: (...args: Events[K]) => void;
  }>;

  const props: Props = $props();
  const unsubscribes: Array<() => void> = [];

  onMount(() => {
    for (const name of Object.keys(props)) {
      const event = name.slice(2) as keyof Events;
      const listener = props[name as keyof Props];

      if (!listener) {
        continue;
      }

      const args = [event, listener as (...args: Events[typeof event]) => void] as const;

      eventManager.on(...args);
      unsubscribes.push(() => eventManager.off(...args));
    }

    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  });
</script>
