import type { OcrBoundingBox } from '$lib/stores/ocr.svelte';
import { mapNormalizedToContent, type Point, type Size } from '$lib/utils/container-utils';
import { clamp } from 'lodash-es';
export type { Point } from '$lib/utils/container-utils';

const distance = (p1: Point, p2: Point) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

export type VerticalMode = 'none' | 'cjk' | 'rotated';

export type OcrBox = {
  id: string;
  points: Point[];
  text: string;
  confidence: number;
  verticalMode: VerticalMode;
};

const CJK_PATTERN =
  /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF\uFF00-\uFFEF]/;

const VERTICAL_ASPECT_RATIO = 1.5;

const containsCjk = (text: string): boolean => CJK_PATTERN.test(text);

const getVerticalMode = (width: number, height: number, text: string): VerticalMode => {
  if (height / width < VERTICAL_ASPECT_RATIO) {
    return 'none';
  }
  return containsCjk(text) ? 'cjk' : 'rotated';
};

/**
 * Calculate bounding box transform from OCR points. Result matrix can be used as input for css matrix3d.
 * @param points - Array of 4 corner points of the bounding box
 * @returns 4x4 matrix to transform the div with text onto the polygon defined by the corner points, and size to set on the source div.
 */
export const calculateBoundingBoxMatrix = (points: Point[]): Size & { matrix: number[] } => {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;

  const width = Math.max(distance(topLeft, topRight), distance(bottomLeft, bottomRight));
  const height = Math.max(distance(topLeft, bottomLeft), distance(topRight, bottomRight));

  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;

  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;

  const det = dx1 * dy2 - dx2 * dy1;
  const a13 = (dx3 * dy2 - dx2 * dy3) / det;
  const a23 = (dx1 * dy3 - dx3 * dy1) / det;

  const a11 = (1 + a13) * topRight.x - topLeft.x;
  const a21 = (1 + a23) * bottomLeft.x - topLeft.x;

  const a12 = (1 + a13) * topRight.y - topLeft.y;
  const a22 = (1 + a23) * bottomLeft.y - topLeft.y;

  // prettier-ignore
  const matrix = [
    a11 / width, a12 / width, 0, a13 / width,
    a21 / height, a22 / height, 0, a23 / height,
    0, 0, 1, 0,
    topLeft.x, topLeft.y, 0, 1,
  ];

  return { matrix, width, height };
};

const BORDER_SIZE = 4;
const HORIZONTAL_PADDING = 16 + BORDER_SIZE;
const VERTICAL_PADDING = 8 + BORDER_SIZE;
const REFERENCE_FONT_SIZE = 100;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 96;
const FALLBACK_FONT = `${REFERENCE_FONT_SIZE}px sans-serif`;

let sharedCanvasContext: CanvasRenderingContext2D | null = null;
let resolvedFont: string | undefined;

const getCanvasContext = (): CanvasRenderingContext2D | null => {
  if (sharedCanvasContext !== null) {
    return sharedCanvasContext;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  sharedCanvasContext = context;
  return sharedCanvasContext;
};

const getReferenceFont = (): string => {
  if (resolvedFont !== undefined) {
    return resolvedFont;
  }
  const fontFamily = globalThis.getComputedStyle?.(document.documentElement).getPropertyValue('--font-sans').trim();
  resolvedFont = fontFamily ? `${REFERENCE_FONT_SIZE}px ${fontFamily}` : FALLBACK_FONT;
  return resolvedFont;
};

export const calculateFittedFontSize = (
  text: string,
  boxWidth: number,
  boxHeight: number,
  verticalMode: VerticalMode,
): number => {
  const isVertical = verticalMode === 'cjk' || verticalMode === 'rotated';
  const availableWidth = boxWidth - (isVertical ? VERTICAL_PADDING : HORIZONTAL_PADDING);
  const availableHeight = boxHeight - (isVertical ? HORIZONTAL_PADDING : VERTICAL_PADDING);

  const context = getCanvasContext();

  if (verticalMode === 'cjk') {
    if (!context) {
      const fontSize = Math.min(availableWidth, availableHeight / text.length);
      return clamp(fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE);
    }

    // eslint-disable-next-line tscompat/tscompat
    context.font = getReferenceFont();

    let maxCharWidth = 0;
    let totalCharHeight = 0;
    for (const character of text) {
      const metrics = context.measureText(character);
      const charWidth = metrics.width;
      const charHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      maxCharWidth = Math.max(maxCharWidth, charWidth);
      totalCharHeight += Math.max(charWidth, charHeight);
    }

    const scaleFromWidth = (availableWidth / maxCharWidth) * REFERENCE_FONT_SIZE;
    const scaleFromHeight = (availableHeight / totalCharHeight) * REFERENCE_FONT_SIZE;
    return clamp(Math.min(scaleFromWidth, scaleFromHeight), MIN_FONT_SIZE, MAX_FONT_SIZE);
  }

  const fitWidth = verticalMode === 'rotated' ? availableHeight : availableWidth;
  const fitHeight = verticalMode === 'rotated' ? availableWidth : availableHeight;

  if (!context) {
    return clamp((1.4 * fitWidth) / text.length, MIN_FONT_SIZE, MAX_FONT_SIZE);
  }

  // Unsupported in Safari iOS <16.6; falls back to default canvas font, giving less accurate but functional sizing
  // eslint-disable-next-line tscompat/tscompat
  context.font = getReferenceFont();

  const metrics = context.measureText(text);
  const measuredWidth = metrics.width;
  const measuredHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  const scaleFromWidth = (fitWidth / measuredWidth) * REFERENCE_FONT_SIZE;
  const scaleFromHeight = (fitHeight / measuredHeight) * REFERENCE_FONT_SIZE;

  return clamp(Math.min(scaleFromWidth, scaleFromHeight), MIN_FONT_SIZE, MAX_FONT_SIZE);
};

export const getOcrBoundingBoxes = (ocrData: OcrBoundingBox[], imageSize: Size): OcrBox[] => {
  const boxes: OcrBox[] = [];
  for (const ocr of ocrData) {
    const points = [
      { x: ocr.x1, y: ocr.y1 },
      { x: ocr.x2, y: ocr.y2 },
      { x: ocr.x3, y: ocr.y3 },
      { x: ocr.x4, y: ocr.y4 },
    ].map((point) => mapNormalizedToContent(point, imageSize));

    const boxWidth = Math.max(distance(points[0], points[1]), distance(points[3], points[2]));
    const boxHeight = Math.max(distance(points[0], points[3]), distance(points[1], points[2]));

    boxes.push({
      id: ocr.id,
      points,
      text: ocr.text,
      confidence: ocr.textScore,
      verticalMode: getVerticalMode(boxWidth, boxHeight, ocr.text),
    });
  }

  const rowThreshold = imageSize.height * 0.02;
  boxes.sort((a, b) => {
    const yDifference = a.points[0].y - b.points[0].y;
    if (Math.abs(yDifference) < rowThreshold) {
      return a.points[0].x - b.points[0].x;
    }
    return yDifference;
  });

  return boxes;
};
