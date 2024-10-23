<script lang="ts">
  import { onMount } from 'svelte';
  import CastPlayer, { loadCastFramework } from '$lib/utils/cast-sender';
  import Button from '$lib/components/elements/buttons/button.svelte';
  onMount(() => {
    loadCastFramework();
  });
</script>

<Button size="icon" color="transparent-primary" rounded="lg" on:click>
  <google-cast-launcher></google-cast-launcher>
</Button>
