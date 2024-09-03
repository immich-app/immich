<script lang="ts">
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';

  export let alt;
  export let preload = false;
  export let src: string;
  let className = '';
  export { className as class };

  let isBroken = false;
</script>

{#if isBroken}
  <BrokenAsset noMessage />
{:else}
  <img
    {alt}
    on:error={() => (isBroken = true)}
    class="z-0 rounded-xl object-cover aspect-square {className}"
    data-testid="album-image"
    draggable="false"
    loading={preload ? 'eager' : 'lazy'}
    {src}
  />
{/if}
