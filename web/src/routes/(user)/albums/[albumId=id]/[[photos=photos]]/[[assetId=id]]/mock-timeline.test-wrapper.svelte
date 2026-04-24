<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';

  interface Props {
    timelineManager?: TimelineManager | Record<string, unknown>;
    options?: Record<string, unknown>;
    album?: { id?: string; assetCount?: number };
    children?: Snippet;
  }

  let { timelineManager = $bindable(), options = {}, album, children }: Props = $props();

  $effect(() => {
    const tagIds = Array.isArray(options.tagIds) ? options.tagIds : [];
    const empty = tagIds.includes('tag-no-match') || album?.assetCount === 0;
    const monthsOnly = album?.id === 'timeline-months-only';

    const nextTimelineManager = {
      months: empty ? [] : [{ yearMonth: { year: 2024, month: 4 }, assetsCount: 2 }],
      assetCount: empty || monthsOnly ? 0 : 2,
      isInitialized: true,
      showAssetOwners: false,
      albumAssets: new Set(['asset-in-album']),
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

<div data-testid="timeline-options">{JSON.stringify(options)}</div>
<div data-testid="mock-disabled-asset" data-asset="asset-in-album" data-disabled="true"></div>
<div data-testid="mock-timeline-asset-count">{timelineManager?.assetCount ?? 0}</div>
{@render children?.()}
