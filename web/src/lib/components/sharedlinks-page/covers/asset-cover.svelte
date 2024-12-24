<script lang="ts">
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';

  interface Props {
    alt?: string;
    preload?: boolean;
    src: string;
    class?: string;
  }

  let { alt, preload = false, src, class: className = '' }: Props = $props();

  let isBroken = $state(false);
</script>

{#if isBroken}
  <BrokenAsset hideMessage class="aspect-square rounded-xl" />
{:else}
  <img
    {alt}
    onerror={() => (isBroken = true)}
    class="size-full rounded-xl object-cover aspect-square {className}"
    data-testid="album-image"
    draggable="false"
    loading={preload ? 'eager' : 'lazy'}
    {src}
  />
{/if}
