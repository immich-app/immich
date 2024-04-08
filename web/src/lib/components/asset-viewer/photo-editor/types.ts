export const ratios = ['free', 'square', 'original', '16_9', '9_16', '5_4', '4_5', '4_3', '3_4', '3_2', '2_3'];
export type ratio = (typeof ratios)[number];
export type filter = {
  blur: number;
  brightness: number;
  contrast: number;
  grayscale: number;
  hueRotate: number;
  invert: number;
  opacity: number;
  saturation: number;
  sepia: number;
};
export type edit = {
  angle: number;
  angleOffset: number;
  aspectRatio: ratio;
  crop: {
    width: number;
    height: number;
  };
  flipX: boolean;
  flipY: boolean;
  filter: filter;
  filterName: string;
  translate: {
    x: number;
    y: number;
  };
  zoom: number;
};

export type mode = 'autofix' | 'crop' | 'adjust' | 'filter';
