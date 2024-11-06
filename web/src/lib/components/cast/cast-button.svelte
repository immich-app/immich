<script lang="ts">
  import CastPlayer, { loadCastFramework } from '$lib/utils/cast-player';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { onMount } from 'svelte';
  onMount(async () => {
    await loadCastFramework();
    CastPlayer.getInstance();
  });
</script>

<Button size="icon" color="transparent-primary" rounded="lg" on:click>
  <google-cast-launcher></google-cast-launcher>
</Button>
