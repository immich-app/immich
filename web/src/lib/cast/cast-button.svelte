<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CastPlayer, { loadCastFramework } from '$lib/utils/cast/gcast-player';
  import { onMount } from 'svelte';
  onMount(() => {
    loadCastFramework();
  });
  window['__onGCastApiAvailable'] = function (isAvailable) {
    // The cast sender can't be initialized until the API is available
    if (isAvailable) {
      CastPlayer.getInstance();
    }
  };
</script>

<Button size="icon" color="transparent-primary" rounded="lg">
  <google-cast-launcher></google-cast-launcher>
</Button>
