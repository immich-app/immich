<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { TooltipPlacement } from 'vidstack';
  type Props = {
    placement: TooltipPlacement;
    content?: Snippet;
    trigger?: Snippet;
  };

  let { placement, content, trigger }: Props = $props();
</script>

<media-tooltip>
  <media-tooltip-trigger>
    {@render trigger?.()}
  </media-tooltip-trigger>
  <media-tooltip-content
    class="tooltip animate-out fade-out slide-out-to-bottom-2 data-[visible]:animate-in data-[visible]:fade-in data-[visible]:slide-in-from-bottom-4 z-10 rounded-sm bg-black/90 px-2 py-0.5 text-sm font-medium text-white"
    {placement}
  >
    {@render content?.()}
  </media-tooltip-content>
</media-tooltip>

<style>
  :global(media-menu[data-open]) .tooltip {
    display: none !important;
  }
</style>
