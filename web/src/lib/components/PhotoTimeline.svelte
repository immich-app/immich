<script lang="ts">
  import PhotoThumbnail from '$lib/components/PhotoThumbnail.svelte';
  import type { AbortError } from '$lib/utils';
  import { getAssetRatio } from '$lib/utils/asset-utils';
  import { getTimeBucket, getTimeBuckets, TimeBucketSize, type AssetResponseDto } from '@immich/sdk';
  import justifiedLayout from 'justified-layout';
  import { onMount } from 'svelte';

  const VIEWPORT_PADDING = 500;

  let scrollEl: HTMLDivElement;
  // let scrollEl: HTMLDivElement;
  let sectionsEl: HTMLDivElement;
  let wrapperHeight = 0;
  let isDirty = true;
  let sections: Section[] = [];
  let visibleSections: Section[] = $state.raw([]);
  let bucketSize = TimeBucketSize.Month;
  let colors = ['bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-violet-500'];

  type SectionStatus = 'placeholder' | 'loading' | 'loaded';
  type Section = {
    timeBucket: string;
    height: number;
    start: number;
    end: number;
    status: SectionStatus;
    color: string;
    layout?: ReturnType<typeof justifiedLayout>;
    assetCount: number;
    assets: AssetResponseDto[];
    abort?: AbortController;
  };

  const targetHeight = 235;

  const onLoad = async () => {
    const buckets = await getTimeBuckets({ size: TimeBucketSize.Month });
    const newSections: Section[] = [];
    let timelineHeight = 0;

    for (const [i, bucket] of buckets.entries()) {
      if (!bucket.count) {
        continue;
      }

      const assetCount = bucket.count;
      const unwrappedWidth = (3 / 2) * assetCount * targetHeight * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / scrollEl.clientWidth);
      const height = rows * targetHeight;

      newSections.push({
        timeBucket: bucket.timeBucket,
        status: 'placeholder',
        start: timelineHeight,
        height,
        color: colors[i % (colors.length - 1)],
        end: timelineHeight + height,
        assetCount,
        assets: [],
      });
      timelineHeight += height;
    }

    wrapperHeight = timelineHeight;
    sectionsEl.style.height = `${wrapperHeight}px`;
    sections = newSections;
  };

  const isInRange = (value: number, start: number, end: number) => value > start && value < end;

  const onRender = () => {
    if (!scrollEl || !scrollEl || sections.length === 0) {
      return;
    }

    const scrollPosition = scrollEl.scrollTop;
    if (!isDirty) {
      return;
    }

    isDirty = false;

    const viewportHeight = scrollEl.clientHeight;
    const padding = viewportHeight;
    const paddedViewportStart = scrollPosition - padding;
    const paddedViewportEnd = scrollPosition + viewportHeight + padding;

    // find sections that are visible in the viewport +/- `padding`
    const included: Section[] = [];

    let newWrapperHeight = 0;

    for (const section of sections) {
      section.start = newWrapperHeight;
      section.end = section.start + section.height;

      newWrapperHeight += section.height;

      const isIncluded =
        // start of section is in viewport
        (section.start > paddedViewportStart && section.start < paddedViewportEnd) ||
        // end of section is in viewport
        (section.end > paddedViewportStart && section.end < paddedViewportEnd) ||
        // viewport is contained in the section
        (section.start < paddedViewportStart && section.end > paddedViewportEnd);

      if (isIncluded) {
        included.push(section);
        if (section.status === 'placeholder') {
          void loadSection(section);
        }
      } else {
        if (section.status === 'loading' && section.abort) {
          abortSection(section);
        }
      }
    }

    wrapperHeight = newWrapperHeight;
    console.log(`updating visible sections (${visibleSections.length})`);
    visibleSections = included.map((item) => ({ ...item }));
  };

  const abortSection = (section: Section) => {
    if (section.abort) {
      console.log(`[${section.timeBucket}] Load abort`);
      section.abort.abort();
      delete section.abort;
    }

    section.status = 'placeholder';
    isDirty = true;
  };

  const loadSection = async (section: Section) => {
    try {
      console.log(`[${section.timeBucket}] Load start`);

      section.status = 'loading';
      section.abort = new AbortController();

      const assets = await getTimeBucket(
        { size: bucketSize, timeBucket: section.timeBucket },
        { signal: section.abort.signal },
      );

      console.log(`[${section.timeBucket}] Load finish`);

      if (!assets) {
        return;
      }

      const layout = justifiedLayout(
        assets.map((asset) => getAssetRatio(asset)),
        {
          boxSpacing: 2,
          containerWidth: Math.ceil(scrollEl.clientWidth),
          containerPadding: 0,
          targetRowHeightTolerance: 0.15,
          targetRowHeight: 235,
        },
      );

      const actualHeight = Math.ceil(layout.containerHeight) + 32;
      section.assets = assets;
      console.log(`[${section.timeBucket}] Update height from ${section.height} to ${actualHeight}`);
      section.height = actualHeight;
      section.status = 'loaded';
      section.layout = layout;

      isDirty = true;
    } catch (error: unknown) {
      section.status = 'placeholder';
      if ((error as AbortError)?.name !== 'AbortError') {
        console.log(error);
      }
    } finally {
      delete section.abort;
      if (section.status === 'loading') {
        section.status = 'placeholder';
      }
    }
  };

  const handleResize = () => {
    isDirty = true;
  };

  const handleScroll = () => {
    isDirty = true;
  };

  function render() {
    onRender();
    requestAnimationFrame(render);
  }

  onMount(() => {
    void onLoad();
    const requestId = requestAnimationFrame(render);

    // setTimeout(() => {
    //   scrollEl.scrollTop = 50000;
    // }, 2000);

    return () => {
      cancelAnimationFrame(requestId);
    };
  });
</script>

<svelte:window onresize={handleResize} />

<div class="h-full w-full">
  <div bind:this={scrollEl} class="absolute w-full overflow-y-auto top-0 h-full" onscroll={handleScroll}>
    <!-- <div bind:this={scrollEl} class="h-full w-full"> -->
    <div bind:this={sectionsEl} class="absolute w-full">
      <!-- section -->
      {#each visibleSections as section (section.timeBucket)}
        <div
          data-section-key={section.timeBucket}
          style="height: {section.height}px; transform: translate3d(0px, {section.start}px, 0px);"
          class="absolute w-full {section.color}"
        >
          <!-- <pre>{section.status}</pre> -->
          <!-- asset -->
          {#if section.status === 'loaded' && section.layout}
            {#each section.assets as asset, i (asset.id)}
              {@const box = section.layout.boxes[i]}
              {#if isInRange(section.start + box.top, scrollEl.scrollTop - VIEWPORT_PADDING, scrollEl.scrollTop + scrollEl.clientHeight + VIEWPORT_PADDING)}
                <div
                  class="absolute border"
                  style="width: {Math.floor(box.width)}px; height: {Math.floor(
                    box.height,
                  )}px; transform: translate3d({Math.floor(box.left)}px, {Math.floor(box.top)}px, 0px)"
                >
                  <!-- <pre class="text-wrap break-all">{asset.id}</pre> -->
                  <PhotoThumbnail {asset} width={box.width} height={box.height} />
                </div>
              {/if}
            {/each}
          {/if}
        </div>
      {/each}
    </div>
    <!-- </div> -->
  </div>
</div>
