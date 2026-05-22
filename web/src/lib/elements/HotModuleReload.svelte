<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { UpdatePayload } from 'vite';

  type Props = {
    onBeforeUpdate?: (payload: UpdatePayload) => void;
    onAfterUpdate?: (payload: UpdatePayload) => void;
  };

  let { onBeforeUpdate, onAfterUpdate }: Props = $props();

  const unsubscribes: (() => void)[] = [];

  onMount(() => {
    const hot = import.meta.hot;
    if (!hot) {
      return;
    }

    if (onBeforeUpdate) {
      hot.on('vite:beforeUpdate', onBeforeUpdate);
      unsubscribes.push(() => hot.off('vite:beforeUpdate', onBeforeUpdate));
    }

    if (onAfterUpdate) {
      hot.on('vite:afterUpdate', onAfterUpdate);
      unsubscribes.push(() => hot.off('vite:afterUpdate', onAfterUpdate));
    }
  });

  onDestroy(() => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  });
</script>
