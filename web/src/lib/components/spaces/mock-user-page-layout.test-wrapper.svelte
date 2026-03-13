<script lang="ts">
  import { TooltipProvider } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    leading?: Snippet;
    buttons?: Snippet;
    children?: Snippet;
  }

  let { title, leading, buttons, children }: Props = $props();
</script>

<TooltipProvider>
  <div data-testid="user-page-layout" data-title={title}>
    {#if leading}
      <div data-testid="layout-leading">
        {@render leading()}
      </div>
    {/if}
    {#if buttons}
      <div data-testid="layout-buttons">
        {@render buttons()}
      </div>
    {/if}
    {@render children?.()}
  </div>
</TooltipProvider>
