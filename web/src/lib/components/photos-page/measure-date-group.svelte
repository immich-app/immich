<script lang="ts" context="module">
  const recentTimes: number[] = [];
  // TODO: track average time to measure, and use this to populate TUNABLES.ASSETS_STORE.CHECK_INTERVAL_MS
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function adjustTunables(avg: number) {}
  function addMeasure(time: number) {
    recentTimes.push(time);
    if (recentTimes.length > 10) {
      recentTimes.shift();
    }
    const sum = recentTimes.reduce((acc: number, val: number) => {
      return acc + val;
    }, 0);
    const avg = sum / recentTimes.length;
    adjustTunables(avg);
  }
</script>

<script lang="ts">
  import { resizeObserver } from '$lib/actions/resize-observer';
  import type { AssetBucket, AssetStore, BucketListener } from '$lib/stores/assets.store';

  export let assetStore: AssetStore;
  export let bucket: AssetBucket;
  export let onMeasured: () => void;

  async function _measure(element: Element) {
    try {
      await bucket.complete;
      const t1 = Date.now();
      let heightPending = bucket.dateGroups.some((group) => !group.heightActual);
      if (heightPending) {
        const listener: BucketListener = (event) => {
          const { type } = event;
          if (type === 'height') {
            const { bucket: changedBucket } = event;
            if (changedBucket === bucket && type === 'height') {
              heightPending = bucket.dateGroups.some((group) => !group.heightActual);
              if (!heightPending) {
                const height = element.getBoundingClientRect().height;
                if (height !== 0) {
                  $assetStore.updateBucket(bucket.bucketDate, { height, measured: true });
                }

                onMeasured();
                $assetStore.removeListener(listener);
                const t2 = Date.now();

                addMeasure((t2 - t1) / bucket.bucketCount);
              }
            }
          }
        };
        assetStore.addListener(listener);
      }
    } catch {
      // ignore if complete rejects (canceled load)
    }
  }
  function measure(element: Element) {
    void _measure(element);
  }
</script>

<section id="measure-asset-group-by-date" class="flex flex-wrap gap-x-12" use:measure>
  {#each bucket.dateGroups as dateGroup}
    <div id="date-group" data-date-group={dateGroup.date}>
      <div use:resizeObserver={({ height }) => $assetStore.updateBucketDateGroup(bucket, dateGroup, { height })}>
        <div
          class="flex z-[100] sticky top-[-1px] pt-7 pb-5 h-6 place-items-center text-xs font-medium text-immich-fg bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg md:text-sm"
          style:width={dateGroup.geometry.containerWidth + 'px'}
        >
          <span class="w-full truncate first-letter:capitalize">
            {dateGroup.groupTitle}
          </span>
        </div>

        <div
          class="relative overflow-clip"
          style:height={dateGroup.geometry.containerHeight + 'px'}
          style:width={dateGroup.geometry.containerWidth + 'px'}
          style:visibility={'hidden'}
        ></div>
      </div>
    </div>
  {/each}
</section>
