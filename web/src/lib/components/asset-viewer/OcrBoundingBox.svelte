<script lang="ts">
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import type { OcrBox } from '$lib/utils/ocr-utils';
  import { calculateBoundingBoxMatrix, calculateFittedFontSize } from '$lib/utils/ocr-utils';

  type Props = {
    ocrBox: OcrBox;
  };

  let { ocrBox }: Props = $props();

  const isTouch = $derived(mediaQueryManager.pointerCoarse);
  const dimensions = $derived(calculateBoundingBoxMatrix(ocrBox.points));

  const transform = $derived(`matrix3d(${dimensions.matrix.join(',')})`);
  const fontSize = $derived(
    calculateFittedFontSize(ocrBox.text, dimensions.width, dimensions.height, ocrBox.verticalMode) + 'px',
  );

  const handleSelectStart = (event: Event) => {
    const target = event.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      const selection = globalThis.getSelection();
      if (selection) {
        selection.selectAllChildren(target);
      }
    });
  };

  const verticalStyle = $derived.by(() => {
    switch (ocrBox.verticalMode) {
      case 'cjk': {
        return 'writing-mode: vertical-rl;';
      }
      case 'rotated': {
        return 'writing-mode: vertical-rl; text-orientation: sideways;';
      }
      default: {
        return '';
      }
    }
  });
</script>

<div
  class={[
    'absolute top-0 left-0 flex items-center justify-center',
    'pointer-events-auto cursor-text border-2 border-blue-500',
    'focus:z-1 focus:border-3 focus:border-blue-600 focus:outline-none',
    isTouch
      ? 'bg-black/60 text-white select-all'
      : 'bg-blue-500/10 text-transparent transition-colors select-text hover:z-1 hover:border-3 hover:border-blue-600 hover:bg-black/60 hover:text-white',
    ocrBox.verticalMode === 'none' ? 'px-2 py-1 whitespace-nowrap' : 'px-1 py-2',
  ]}
  style="font-size: {fontSize}; width: {dimensions.width}px; height: {dimensions.height}px; transform: {transform}; transform-origin: 0 0; touch-action: none; {verticalStyle}"
  data-testid="ocr-box"
  data-overlay-interactive
  tabindex="0"
  role="button"
  aria-label={ocrBox.text}
  onselectstart={isTouch ? handleSelectStart : undefined}
>
  {ocrBox.text}
</div>
