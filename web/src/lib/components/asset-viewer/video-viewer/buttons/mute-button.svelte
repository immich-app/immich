<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiVolumeHigh, mdiVolumeLow, mdiVolumeMute } from '@mdi/js';
  import type { TooltipPlacement } from 'vidstack';
  import Tooltip from '../tooltip.svelte';

  type Props = {
    tooltipPlacement: TooltipPlacement;
  };

  let { tooltipPlacement }: Props = $props();
</script>

<Tooltip placement={tooltipPlacement}>
  {#snippet trigger()}
    <media-mute-button
      class="ring-media-focus group text-white relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 data-[focus]:ring-4"
    >
      <Icon class="w-6 h-6 hidden group-data-[state='muted']:block" path={mdiVolumeMute} color="currentColor" />
      <Icon class="w-6 h-6 hidden group-data-[state='low']:block" path={mdiVolumeLow} color="currentColor" />
      <Icon class="w-6 h-6 hidden group-data-[state='high']:block" path={mdiVolumeHigh} color="currentColor" />
    </media-mute-button>
  {/snippet}

  {#snippet content()}
    <span class="media-muted:hidden">Mute</span>
    <span class="media-muted:block hidden">Unmute</span>
  {/snippet}
</Tooltip>
