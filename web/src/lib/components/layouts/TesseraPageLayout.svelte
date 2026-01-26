<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="tessera-page min-h-dvh bg-[#FAF9F7] text-[#3D3D3D]">
  {@render children?.()}
</div>

<style>
  :global(.tessera-page) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
  }

  :global(.tessera-page .font-display) {
    font-family: 'Playfair Display', Georgia, serif;
  }
</style>
