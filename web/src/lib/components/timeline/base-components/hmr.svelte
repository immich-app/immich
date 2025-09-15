<script lang="ts">
  import { onMount } from 'svelte';
  import type { UpdatePayload } from 'vite';

  interface Props {
    onAfterUpdate: (payload: UpdatePayload) => void;
  }
  let { onAfterUpdate }: Props = $props();

  onMount(() => {
    const hot = import.meta.hot;
    if (hot) {
      hot.on('vite:afterUpdate', onAfterUpdate);
      return () => hot.off('vite:afterUpdate', onAfterUpdate);
    }
  });
</script>
