import { writable } from 'svelte/store';

export interface Faces {
  imageHeight: number;
  imageWidth: number;
  boundingBoxX1: number;
  boundingBoxX2: number;
  boundingBoxY1: number;
  boundingBoxY2: number;
}

interface BoundingBoxStyle {
  color: string;
  isSelected: boolean;
}

export interface BoundingBoxType {
  boundingBoxStyle: BoundingBoxStyle;
  faces: Faces;
}

export function getBorderColor(personId: string): string {
  return `#${personId.slice(-6)}`;
}

function createBoundingBoxStyle(personId: string, isSelected: boolean): BoundingBoxStyle {
  return { color: getBorderColor(personId), isSelected };
}

export function createBoundingBoxType(faces: Faces, personId: string, isSelected: boolean): BoundingBoxType {
  return { boundingBoxStyle: createBoundingBoxStyle(personId, isSelected), faces };
}

export const boundingBoxesArray = writable<BoundingBoxType[]>([]);
