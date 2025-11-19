<script lang="ts">
  import type { OcrBox } from '$lib/utils/ocr-utils';
  import { calculateBoundingBoxDimensions } from '$lib/utils/ocr-utils';

  interface Props {
    ocrBox: OcrBox;
  }

  let { ocrBox }: Props = $props();

  const dimensions = $derived(calculateBoundingBoxDimensions(ocrBox.points));
  
  const transform = $derived(
    `translate(${dimensions.minX}px, ${dimensions.minY}px) rotate(${dimensions.rotation}deg) skew(${dimensions.skewX}deg, ${dimensions.skewY}deg)`
  );
  
  const transformOrigin = $derived(
    `${dimensions.centerX - dimensions.minX}px ${dimensions.centerY - dimensions.minY}px`
  );
</script>

<div class="absolute group left-0 top-0 pointer-events-none">
  <!-- Bounding box with CSS transforms -->
  <div
    class="absolute border-2 border-blue-500 bg-blue-500/10 cursor-pointer pointer-events-auto transition-all group-hover:bg-blue-500/30 group-hover:border-blue-600 group-hover:border-[3px]"
    style="width: {dimensions.width}px; height: {dimensions.height}px; transform: {transform}; transform-origin: {transformOrigin};"
  ></div>
  
  <!-- Tooltip overlay -->
  <p
    class="absolute hidden group-hover:flex items-center justify-center bg-black/75 text-white text-sm px-2 py-1 pointer-events-auto cursor-text whitespace-pre-wrap wrap-break-word z-10 select-text"
    style="width: {dimensions.width}px; height: {dimensions.height}px; transform: {transform}; transform-origin: {transformOrigin};"
  >
    {ocrBox.text}
  </p>
</div>
