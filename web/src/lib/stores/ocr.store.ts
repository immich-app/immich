import { writable } from 'svelte/store';

export interface OcrBoundingBox {
  id: string;
  assetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;
  boxScore: number;
  textScore: number;
  text: string;
}

export const ocrDataArray = writable<OcrBoundingBox[]>([]);
export const showOcrOverlay = writable<boolean>(false);
