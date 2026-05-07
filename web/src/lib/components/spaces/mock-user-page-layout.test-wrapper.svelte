<script lang="ts">
  import { TooltipProvider } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    leading?: Snippet;
    descriptionTrailing?: Snippet;
    buttons?: Snippet;
    children?: Snippet;
  }

  let { title, description, leading, descriptionTrailing, buttons, children }: Props = $props();
</script>

<TooltipProvider>
  <div data-testid="user-page-layout" data-title={title} data-description={description}>
    {#if leading}
      <div data-testid="layout-leading">
        {@render leading()}
      </div>
    {/if}
    {#if descriptionTrailing}
      <div data-testid="layout-description-trailing">
        {@render descriptionTrailing()}
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
