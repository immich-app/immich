<script lang="ts">
  import { onMount } from 'svelte';
  import type { UpdatePayload } from 'vite';

  interface Props {
    onAfterUpdate: (payload: UpdatePayload) => void;
  }
  let { onAfterUpdate }: Props = $props();

  onMount(() => {
    if (import.meta && import.meta?.hot) {
      import.meta.hot?.on('vite:afterUpdate', onAfterUpdate);
      return () => import.meta.hot?.off('vite:afterUpdate', onAfterUpdate);
    }
  });
</script>
