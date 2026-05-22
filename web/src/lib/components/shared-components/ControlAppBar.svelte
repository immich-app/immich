<script lang="ts">
  import { ControlBar, ControlBarContent, ControlBarHeader, ControlBarOverflow, ControlBarTitle } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import type { Snippet } from 'svelte';

  interface Props {
    backIcon?: string;
    class?: string;
    forceDark?: boolean;
    onClose?: () => void;
    title?: Snippet | string;
    leading?: Snippet;
    children?: Snippet;
    trailing?: Snippet;
  }

  let {
    backIcon = mdiClose,
    class: className = '',
    forceDark = false,
    onClose,
    title,
    leading,
    children,
    trailing,
  }: Props = $props();
</script>

<div class={['absolute top-0 w-full bg-transparent p-2', forceDark && 'dark']}>
  <ControlBar closeIcon={backIcon} {onClose} shape="round" class={className}>
    {#if title || leading}
      <ControlBarHeader>
        {#if title}
          <ControlBarTitle>
            {#if typeof title === 'string'}
              {title}
            {:else}
              {@render title()}
            {/if}
          </ControlBarTitle>
        {/if}
        {@render leading?.()}
      </ControlBarHeader>
    {/if}

    {#if children}
      <ControlBarContent>
        {@render children()}
      </ControlBarContent>
    {/if}

    {#if trailing}
      <ControlBarOverflow>
        {@render trailing()}
      </ControlBarOverflow>
    {/if}
  </ControlBar>
</div>
