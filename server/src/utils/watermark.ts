import { type OverlayOptions } from 'sharp';

interface WatermarkOptions {
  text?: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

const createWatermarkSVG = ({ text = 'sample', fontSize = 50, width = 300, height = 300 }: WatermarkOptions): string =>
  `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .heavy {
        font: bold ${fontSize}px sans-serif;
        fill: rgba(255, 255, 255, 0.5);
        stroke: rgba(0, 0, 0, 0.5);
        stroke-width: 1;
        paint-order: stroke fill;
      }
    </style>
    <text
      x="50%"
      y="50%"
      dominant-baseline="middle"
      text-anchor="middle"
      class="heavy"
      transform="rotate(-45,${width / 2},${height / 2})"
    >
      ${text}
    </text>
  </svg>`;

export const createWatermarkOverlay = (opts: WatermarkOptions): OverlayOptions => ({
  input: Buffer.from(createWatermarkSVG(opts)),
  tile: true,
  gravity: 'centre',
});
