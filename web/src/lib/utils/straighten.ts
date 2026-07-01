export type Size = {
  width: number;
  height: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function calculateStraightenScale(imageSize: Size, angleDegrees: number): number {
  if (
    angleDegrees === 0 ||
    !Number.isFinite(imageSize.width) ||
    !Number.isFinite(imageSize.height) ||
    imageSize.width <= 0 ||
    imageSize.height <= 0
  ) {
    return 1;
  }

  const radians = (Math.abs(angleDegrees) * Math.PI) / 180;
  const cosA = Math.cos(radians);
  const sinA = Math.sin(radians);
  const widthRatio = (imageSize.width * cosA + imageSize.height * sinA) / imageSize.width;
  const heightRatio = (imageSize.width * sinA + imageSize.height * cosA) / imageSize.height;

  return Math.max(widthRatio, heightRatio, 1);
}

export function calculateLargestInscribedRect(imageSize: Size, angleDegrees: number, aspectRatioStr: string): Rect {
  const { width, height } = imageSize;

  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const radians = (Math.abs(angleDegrees % 180) * Math.PI) / 180;

  let r: number;
  if (aspectRatioStr === 'free' || aspectRatioStr === 'reset') {
    r = width / height;
  } else {
    const [wRatio, hRatio] = aspectRatioStr.split(':').map(Number);
    r = wRatio && hRatio && hRatio > 0 ? wRatio / hRatio : width / height;
  }

  const cosA = Math.cos(radians);
  const sinA = Math.sin(radians);

  const hLimit1 = width / (r * cosA + sinA);
  const hLimit2 = height / (r * sinA + cosA);

  const h = Math.min(hLimit1, hLimit2);
  const w = h * r;

  const x = (width - w) / 2;
  const y = (height - h) / 2;

  const roundedWidth = Math.max(1, Math.min(width, Math.floor(w)));
  const roundedHeight = Math.max(1, Math.min(height, Math.floor(h)));
  const roundedX = Math.max(0, Math.min(width - roundedWidth, Math.floor(x)));
  const roundedY = Math.max(0, Math.min(height - roundedHeight, Math.floor(y)));

  return {
    x: roundedX,
    y: roundedY,
    width: roundedWidth,
    height: roundedHeight,
  };
}
