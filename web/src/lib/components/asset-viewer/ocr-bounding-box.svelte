<script lang="ts">
  import type { OcrBox } from '$lib/utils/ocr-utils';
  import { calculateBoundingBoxDimensions } from '$lib/utils/ocr-utils';

  type Props = {
    ocrBox: OcrBox;
  };

  let { ocrBox }: Props = $props();

  const dimensions = $derived(calculateBoundingBoxDimensions(ocrBox.points));

  const transform = $derived(
    `translate(${dimensions.minX}px, ${dimensions.minY}px) rotate(${dimensions.rotation}deg) skew(${dimensions.skewX}deg, ${dimensions.skewY}deg)`,
  );

  const transformOrigin = $derived(
    `${dimensions.centerX - dimensions.minX}px ${dimensions.centerY - dimensions.minY}px`,
  );
</script>

<div class="absolute group left-0 top-0 pointer-events-none">
  <!-- Bounding box with CSS transforms -->
  <div
    class="absolute border-2 border-blue-500 bg-blue-500/10 cursor-pointer pointer-events-auto transition-all group-hover:bg-blue-500/30 group-hover:border-blue-600 group-hover:border-[3px]"
    style="width: {dimensions.width}px; height: {dimensions.height}px; transform: {transform}; transform-origin: {transformOrigin};"
  ></div>

  <!-- Text overlay - always rendered but invisible, allows text selection and copy -->
  <div
    class="absolute flex items-center justify-center text-transparent text-sm px-2 py-1 pointer-events-auto cursor-text whitespace-pre-wrap wrap-break-word select-text group-hover:text-white group-hover:bg-black/75 group-hover:z-10"
    style="width: {dimensions.width}px; height: {dimensions.height}px; transform: {transform}; transform-origin: {transformOrigin};"
  >
    {ocrBox.text}
  </div>
</div>
