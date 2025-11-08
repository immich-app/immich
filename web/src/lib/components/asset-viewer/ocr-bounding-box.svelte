<script lang="ts">
  import type { OcrBox } from '$lib/utils/ocr-utils';

  interface Props {
    ocrBox: OcrBox;
  }

  let { ocrBox }: Props = $props();

  const points = $derived(ocrBox.points);
  const minX = $derived(Math.min(points[0].x, points[1].x, points[2].x, points[3].x));
  const maxX = $derived(Math.max(points[0].x, points[1].x, points[2].x, points[3].x));
  const minY = $derived(Math.min(points[0].y, points[1].y, points[2].y, points[3].y));
  const maxY = $derived(Math.max(points[0].y, points[1].y, points[2].y, points[3].y));
  const width = $derived(maxX - minX);
  const height = $derived(maxY - minY);
  const pathData = $derived(
    `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`,
  );

  // Calculate rotation angle from the bottom edge (points[3] to points[2])
  const rotation = $derived(Math.atan2(points[2].y - points[3].y, points[2].x - points[3].x) * (180 / Math.PI));

  // Calculate center point for rotation
  const centerX = $derived((minX + maxX) / 2);
  const centerY = $derived((minY + maxY) / 2);
</script>

<div class="absolute group" style="left: 0; top: 0;">
  <!-- Hover region covering the bounding box -->
  <div
    class="absolute cursor-pointer"
    style="left: {minX}px; top: {minY}px; width: {width}px; height: {height}px;"
  ></div>
  <!-- SVG path for the actual shape -->
  <svg class="absolute" style="left: 0; top: 0; overflow: visible;">
    <path
      d={pathData}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="rgb(59, 130, 246)"
      stroke-width="2"
      class="transition-all group-hover:fill-[rgba(59,130,246,0.3)] group-hover:stroke-[rgb(37,99,235)] group-hover:stroke-3"
    />
  </svg>
  <!-- Tooltip overlay directly on the bounding box -->
  <p
    class="absolute hidden group-hover:flex items-center justify-center bg-black/75 text-white text-sm px-2 py-1 pointer-events-auto cursor-text whitespace-pre-wrap wrap-break-word z-10"
    style="left: {minX}px; top: {minY}px; width: {width}px; height: {height}px; user-select: text; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; transform: rotate({rotation}deg); transform-origin: {centerX -
      minX}px {centerY - minY}px;"
  >
    {ocrBox.text}
  </p>
</div>
