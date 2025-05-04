<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiPause, mdiPlay } from '@mdi/js';
  import type { TooltipPlacement } from 'vidstack';
  import Tooltip from '../tooltip.svelte';

  type Props = {
    tooltipPlacement: TooltipPlacement;
  };

  let { tooltipPlacement }: Props = $props();
</script>

<Tooltip placement={tooltipPlacement}>
  {#snippet trigger()}
    <media-play-button
      class="ring-media-focus text-white relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 data-[focus]:ring-4"
    >
      <Icon class="w-5 h-5 media-playing:hidden" path={mdiPlay} color="currentColor" />
      <Icon class="w-5 h-5 media-paused:hidden" path={mdiPause} color="currentColor" />
    </media-play-button>
  {/snippet}

  {#snippet content()}
    <span class="media-playing:hidden">Play</span>
    <span class="media-paused:hidden">Pause</span>
  {/snippet}
</Tooltip>
