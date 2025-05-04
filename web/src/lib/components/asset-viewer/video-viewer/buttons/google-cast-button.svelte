<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCastVariant } from '@mdi/js';
  import type { TooltipPlacement } from 'vidstack';
  import Tooltip from '../tooltip.svelte';
  type Props = {
    tooltipPlacement: TooltipPlacement;
  };

  let { tooltipPlacement }: Props = $props();
</script>

<Tooltip placement={tooltipPlacement}>
  {#snippet trigger()}
    <media-google-cast-button
      class="ring-media-focus text-white group relative mr-0.5 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 data-[focus]:ring-4 aria-hidden:hidden"
    >
      <Icon class=" w-5 h-5" path={mdiCastVariant} color="currentColor"></Icon>
    </media-google-cast-button>
  {/snippet}

  {#snippet content()}
    <span>Google Cast</span>
  {/snippet}
</Tooltip>
