// Coordinate spaces used throughout the viewer:
//
// "Normalized": 0–1 range, (0,0) = top-left, (1,1) = bottom-right. Resolution-independent.
//   Example: OCR coordinates, or face coords after dividing by metadata dimensions.
//
// "Content": pixel position within the container after scaling (scaleToFit/scaleToCover)
//   and centering. Used for DOM overlay positioning (face boxes, OCR text).
//
// "Natural": pixel position in the original full-resolution image file (e.g. 4000×3000).
//   Used when cropping or drawing on the source image.
//
// "Metadata pixel space": coordinates from face detection / OCR models, in pixels relative
//   to face.imageWidth/imageHeight. Divide by those dimensions to get normalized coords.

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type ContentMetrics = {
  contentWidth: number;
  contentHeight: number;
  offsetX: number;
  offsetY: number;
};

export const scaleToCover = (dimensions: Size, container: Size): Size => {
  const scaleX = container.width / dimensions.width;
  const scaleY = container.height / dimensions.height;
  const scale = Math.max(scaleX, scaleY);
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
  };
};

export const scaleToFit = (dimensions: Size, container: Size): Size => {
  const scaleX = container.width / dimensions.width;
  const scaleY = container.height / dimensions.height;
  const scale = Math.min(scaleX, scaleY);
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
  };
};

export const getNaturalSize = (element: HTMLImageElement | HTMLVideoElement): Size => {
  if (element instanceof HTMLVideoElement) {
    return { width: element.videoWidth, height: element.videoHeight };
  }
  return { width: element.naturalWidth, height: element.naturalHeight };
};

export function computeContentMetrics(imageSize: Size, containerSize: Size): ContentMetrics {
  if (imageSize.width === 0 || imageSize.height === 0) {
    return { contentWidth: 0, contentHeight: 0, offsetX: 0, offsetY: 0 };
  }
  const { width: contentWidth, height: contentHeight } = scaleToFit(imageSize, containerSize);
  return {
    contentWidth,
    contentHeight,
    offsetX: (containerSize.width - contentWidth) / 2,
    offsetY: (containerSize.height - contentHeight) / 2,
  };
}

export function mapNormalizedToContent(point: Point, sizeOrMetrics: Size | ContentMetrics): Point {
  if ('contentWidth' in sizeOrMetrics) {
    return {
      x: point.x * sizeOrMetrics.contentWidth + sizeOrMetrics.offsetX,
      y: point.y * sizeOrMetrics.contentHeight + sizeOrMetrics.offsetY,
    };
  }
  return {
    x: point.x * sizeOrMetrics.width,
    y: point.y * sizeOrMetrics.height,
  };
}

export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function mapNormalizedRectToContent(
  topLeft: Point,
  bottomRight: Point,
  sizeOrMetrics: Size | ContentMetrics,
): Rect {
  const tl = mapNormalizedToContent(topLeft, sizeOrMetrics);
  const br = mapNormalizedToContent(bottomRight, sizeOrMetrics);
  return {
    top: tl.y,
    left: tl.x,
    width: br.x - tl.x,
    height: br.y - tl.y,
  };
}

export function mapContentToNatural(point: Point, metrics: ContentMetrics, naturalSize: Size): Point {
  return {
    x: ((point.x - metrics.offsetX) / metrics.contentWidth) * naturalSize.width,
    y: ((point.y - metrics.offsetY) / metrics.contentHeight) * naturalSize.height,
  };
}

export function mapContentRectToNatural(rect: Rect, metrics: ContentMetrics, naturalSize: Size): Rect {
  const topLeft = mapContentToNatural({ x: rect.left, y: rect.top }, metrics, naturalSize);
  const bottomRight = mapContentToNatural(
    { x: rect.left + rect.width, y: rect.top + rect.height },
    metrics,
    naturalSize,
  );
  return {
    top: topLeft.y,
    left: topLeft.x,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}
