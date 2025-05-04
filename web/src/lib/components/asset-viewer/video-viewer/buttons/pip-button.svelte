<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiPictureInPictureBottomRight, mdiSquare } from '@mdi/js';
  import type { TooltipPlacement } from 'vidstack';
  import Tooltip from '../tooltip.svelte';
  type Props = {
    tooltipPlacement: TooltipPlacement;
  };

  let { tooltipPlacement }: Props = $props();
</script>

<Tooltip placement={tooltipPlacement}>
  {#snippet trigger()}
    <media-pip-button
      class="ring-media-focus text-white group relative mr-0.5 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 data-[focus]:ring-4 aria-hidden:hidden"
    >
      <Icon class="media-pip:hidden w-5 h-5" path={mdiPictureInPictureBottomRight} color="currentColor"></Icon>
      <Icon class="not-media-pip:hidden w-5 h-5" path={mdiSquare} color="currentColor"></Icon>
    </media-pip-button>
  {/snippet}

  {#snippet content()}
    <span class="media-pip:hidden">Enter PIP</span>
    <span class="media-pip:block hidden">Exit PIP</span>
  {/snippet}
</Tooltip>
