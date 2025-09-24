<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements';

  interface Props extends HTMLImgAttributes {
    noText?: boolean;
    class?: string | undefined;
  }

  let { noText = false, class: cssClass }: Props = $props();
  const viewBox = $derived(`0 0 ${noText ? '260' : '792'} 266.25`);
</script>

{#if noText}
  <img src="/pixelunion.svg" alt="PixelUnion Logo" style="max-height: 56px;" />
{:else}
  <img src="https://pixelunion.eu/images/logo.png" alt="PixelUnion Logo" style="max-height: 56px;" />
{/if}
