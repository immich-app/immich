<script lang="ts">
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    timelineManager?: TimelineManager | Record<string, unknown>;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { timelineManager = $bindable(), children, ...rest }: Props = $props();

  $effect(() => {
    const nextTimelineManager = {
      months: [{ yearMonth: { year: 2026, month: 1 }, assetsCount: 2 }],
      assetCount: 2,
      isInitialized: true,
      showAssetOwners: false,
      suspendTransitions: false,
      removeAssets: () => {},
      upsertAssets: () => {},
      update: () => {},
      toggleShowAssetOwners: () => {},
      getRandomAsset: () => Promise.resolve(undefined),
    };

    if (timelineManager) {
      Object.assign(timelineManager, nextTimelineManager);
    } else {
      timelineManager = nextTimelineManager;
    }
  });
</script>

<div {...rest} data-testid="timeline-stub" data-has-timeline={String(timelineManager !== undefined)}>
  {@render children?.()}
</div>
