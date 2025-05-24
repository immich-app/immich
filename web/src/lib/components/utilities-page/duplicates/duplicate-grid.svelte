<script lang="ts" generics="T extends unknown">
  import type { Snippet } from 'svelte';

  // Props for the virtualized grid
  interface Props {
    items: Array<T>;
    itemHeight: number;
    itemWidth: number;
    item: Snippet<[T]>;
    placeholder: Snippet<[T]>;
    gap?: number;
    containerHeight?: string | number;
    containerWidth?: string | number;
  }

  let {
    items,
    itemHeight,
    itemWidth,
    item: itemSnippet,
    placeholder,
    gap = 0,
    containerHeight = '100%',
    containerWidth = '100%',
  }: Props = $props();

  const IS_SCROLLING_FAST_THRESHOLD = 100;
  const SCROLL_STOP_DEBOUNCE_TIME_MS = 150;

  let scrollContainerRef = $state<HTMLDivElement>();
  let scrollTop = $state(0);
  let actualContainerPixelWidth = $state(0);
  let actualContainerPixelHeight = $state(0);
  // When scrolling fast, we don't try to render any items
  // The main purpose of this is to prevent starting fetches for images that aren't going to end up being visible after scrolling
  let isScrollingFast = $state(false);
  let scrollTimeout: NodeJS.Timeout | null = $state(null);

  // Effect to observe container dimensions and initialize
  $effect(() => {
    if (scrollContainerRef) {
      const observer = new ResizeObserver(() => {
        actualContainerPixelWidth = scrollContainerRef!.clientWidth;
        actualContainerPixelHeight = scrollContainerRef!.clientHeight;
      });
      observer.observe(scrollContainerRef);

      // Set initial dimensions immediately
      actualContainerPixelWidth = scrollContainerRef.clientWidth;
      actualContainerPixelHeight = scrollContainerRef.clientHeight;

      return () => {
        observer.unobserve(scrollContainerRef!);
        observer.disconnect();
      };
    }
  });

  // calculations for grid layout
  const columns = $derived(
    actualContainerPixelWidth > 0 && itemWidth > 0
      ? Math.max(1, Math.floor((actualContainerPixelWidth + gap) / (itemWidth + gap)))
      : 1,
  );

  const effectiveItemHeightWithGap = $derived(itemHeight + gap);
  const effectiveItemWidthWithGap = $derived(itemWidth + gap);

  const totalRows = $derived(items.length > 0 && columns > 0 && itemHeight > 0 ? Math.ceil(items.length / columns) : 0);

  // Total height of the content area, determines scrollbar size
  const totalContentHeight = $derived(
    totalRows * effectiveItemHeightWithGap - (totalRows > 0 ? gap : 0), // Subtract gap for the last row
  );

  // Determine which rows to render (visible rows + buffer)
  const bufferRows = $state(1); // Render 1 extra row above and 1 below the visible area

  const firstVisibleRowIndex = $derived(
    effectiveItemHeightWithGap > 0 ? Math.floor(scrollTop / effectiveItemHeightWithGap) : 0,
  );

  const numVisibleRowsOnScreen = $derived(
    effectiveItemHeightWithGap > 0 ? Math.ceil(actualContainerPixelHeight / effectiveItemHeightWithGap) : 0,
  );

  const firstRowToRender = $derived(Math.max(0, firstVisibleRowIndex - bufferRows));

  const lastRowToRender = $derived(
    Math.min(totalRows - 1, firstVisibleRowIndex + numVisibleRowsOnScreen + bufferRows - 1),
  );

  // Calculate the actual items to render with their styles
  const itemsToRender = $derived.by(() => {
    const result: Array<{ originalIndex: number; style: string }> = [];

    if (
      items.length === 0 ||
      actualContainerPixelWidth === 0 ||
      actualContainerPixelHeight === 0 ||
      columns === 0 ||
      totalRows === 0 ||
      itemHeight <= 0 ||
      itemWidth <= 0
    ) {
      return result; // Nothing to render if data or dimensions are invalid/zero
    }

    const startIndex = firstRowToRender * columns;
    const endIndex = Math.min(items.length, (lastRowToRender + 1) * columns);

    for (let i = startIndex; i < endIndex; i++) {
      const currentRow = Math.floor(i / columns);
      const currentCol = i % columns;

      const top = currentRow * effectiveItemHeightWithGap;
      const left = currentCol * effectiveItemWidthWithGap;

      result.push({
        originalIndex: i,
        style: `top: ${top}px; left: ${left}px; width: ${itemWidth}px; height: ${itemHeight}px;`,
      });
    }
    return result;
  });

  // Style for the main scrollable container
  const outerContainerStyle = $derived(
    `height: ${typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight}; width: ${typeof containerWidth === 'number' ? `${containerWidth}px` : containerWidth}; `,
  );

  // Style for the inner div that dictates the scrollable area height
  const innerScrollerStyle = $derived(`height: ${totalContentHeight}px;`);
</script>

<div
  bind:this={scrollContainerRef}
  onscroll={(e) => {
    // Calculate if we are scrolling fast
    const scrollSpeed = Math.abs(scrollTop - e.currentTarget.scrollTop);

    scrollTop = e.currentTarget.scrollTop;

    isScrollingFast = scrollSpeed > IS_SCROLLING_FAST_THRESHOLD;

    // Clear any existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Set a new timeout to detect when scrolling has stopped
    scrollTimeout = setTimeout(() => {
      isScrollingFast = false;
    }, SCROLL_STOP_DEBOUNCE_TIME_MS);
  }}
  class="overflow-auto relative"
  style={outerContainerStyle}
>
  <div style={innerScrollerStyle} class="w-full relative">
    {#each itemsToRender as visibleItem (visibleItem.originalIndex)}
      <div class="absolute" style={visibleItem.style}>
        {#if isScrollingFast}
          {@render placeholder(items[visibleItem.originalIndex])}
        {:else}
          {@render itemSnippet(items[visibleItem.originalIndex])}
        {/if}
      </div>
    {/each}
  </div>
</div>
