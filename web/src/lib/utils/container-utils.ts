export interface ContentMetrics {
  contentWidth: number;
  contentHeight: number;
  offsetX: number;
  offsetY: number;
}

export const scaleToFit = (
  dimensions: { width: number; height: number },
  container: { width: number; height: number },
): { width: number; height: number } => {
  const scaleX = container.width / dimensions.width;
  const scaleY = container.height / dimensions.height;
  const scale = Math.min(scaleX, scaleY);
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
  };
};

const getElementSize = (element: HTMLImageElement | HTMLVideoElement): { width: number; height: number } => {
  if (element instanceof HTMLVideoElement) {
    return { width: element.clientWidth, height: element.clientHeight };
  }
  return { width: element.width, height: element.height };
};

export const getNaturalSize = (element: HTMLImageElement | HTMLVideoElement): { width: number; height: number } => {
  if (element instanceof HTMLVideoElement) {
    return { width: element.videoWidth, height: element.videoHeight };
  }
  return { width: element.naturalWidth, height: element.naturalHeight };
};

export const getContentMetrics = (element: HTMLImageElement | HTMLVideoElement): ContentMetrics => {
  const natural = getNaturalSize(element);
  const client = getElementSize(element);
  const { width: contentWidth, height: contentHeight } = scaleToFit(natural, client);
  return {
    contentWidth,
    contentHeight,
    offsetX: (client.width - contentWidth) / 2,
    offsetY: (client.height - contentHeight) / 2,
  };
};
