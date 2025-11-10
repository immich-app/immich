<script lang="ts">
  import type { OcrBox } from '$lib/utils/ocr-utils';
  import { calculateBoundingBoxDimensions } from '$lib/utils/ocr-utils';

  interface Props {
    ocrBox: OcrBox;
  }

  let { ocrBox }: Props = $props();

  const dimensions = $derived(calculateBoundingBoxDimensions(ocrBox.points));
</script>

<div class="absolute group left-0 top-0">
  <!-- Hover region covering the bounding box -->
  <div
    class="absolute cursor-pointer"
    style="left: {dimensions.minX}px; top: {dimensions.minY}px; width: {dimensions.width}px; height: {dimensions.height}px;"
  ></div>
  <!-- SVG path for the actual shape -->
  <svg class="absolute left-0 top-0 overflow-visible">
    <path
      d={dimensions.pathData}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="rgb(59, 130, 246)"
      stroke-width="2"
      class="transition-all group-hover:fill-[rgba(59,130,246,0.3)] group-hover:stroke-[rgb(37,99,235)] group-hover:stroke-3"
    />
  </svg>
  <!-- Tooltip overlay directly on the bounding box -->
  <p
    class="absolute hidden group-hover:flex items-center justify-center bg-black/75 text-white text-sm px-2 py-1 pointer-events-auto cursor-text whitespace-pre-wrap wrap-break-word z-10 select-text"
    style="left: {dimensions.minX}px; top: {dimensions.minY}px; width: {dimensions.width}px; height: {dimensions.height}px; transform: rotate({dimensions.rotation}deg); transform-origin: {dimensions.centerX -
      dimensions.minX}px {dimensions.centerY - dimensions.minY}px;"
  >
    {ocrBox.text}
  </p>
</div>
