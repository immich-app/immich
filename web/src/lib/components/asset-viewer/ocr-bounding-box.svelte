<script lang="ts">
  import type { OcrBox } from '$lib/utils/ocr-utils';
  import { calculateBoundingBoxMatrix } from '$lib/utils/ocr-utils';

  type Props = {
    ocrBox: OcrBox;
  };

  let { ocrBox }: Props = $props();

  const dimensions = $derived(calculateBoundingBoxMatrix(ocrBox.points));

  const transform = $derived(`matrix3d(${dimensions.matrix.join(',')})`);
  // Fits almost all strings within the box, depends on font family
  const fontSize = $derived(
    `max(var(--text-sm), min(var(--text-6xl), ${(1.4 * dimensions.width) / ocrBox.text.length}px))`,
  );
</script>

<div class="absolute left-0 top-0">
  <div
    class="absolute flex items-center justify-center text-transparent text-sm border-2 border-blue-500 bg-blue-500/10 px-2 py-1 pointer-events-auto cursor-text whitespace-pre-wrap wrap-break-word select-text transition-all hover:text-white hover:bg-black/60 hover:border-blue-600 hover:border-3"
    style="font-size: {fontSize}; width: {dimensions.width}px; height: {dimensions.height}px; transform: {transform}; transform-origin: 0 0;"
  >
    {ocrBox.text}
  </div>
</div>
