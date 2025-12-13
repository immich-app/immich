import { writable } from 'svelte/store';

export interface Faces {
  imageHeight: number;
  imageWidth: number;
  boundingBoxX1: number;
  boundingBoxX2: number;
  boundingBoxY1: number;
  boundingBoxY2: number;
}

export const boundingBoxesArray = writable<Faces[]>([]);
