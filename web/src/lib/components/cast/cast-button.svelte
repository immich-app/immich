<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCastFramework } from '$lib/utils/cast-sender';
  onMount(() => {
    loadCastFramework();
  });
</script>

<google-cast-launcher></google-cast-launcher>
