export interface DisplayMetrics {
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
}

export const getContainedSize = (element: HTMLImageElement | HTMLVideoElement): { width: number; height: number } => {
  if (element instanceof HTMLVideoElement) {
    const ratio = element.videoWidth / element.videoHeight;
    let width = element.clientHeight * ratio;
    let height = element.clientHeight;
    if (width > element.clientWidth) {
      width = element.clientWidth;
      height = element.clientWidth / ratio;
    }
    return { width, height };
  }

  const ratio = element.naturalWidth / element.naturalHeight;
  let width = element.height * ratio;
  let height = element.height;
  if (width > element.width) {
    width = element.width;
    height = element.width / ratio;
  }
  return { width, height };
};

export const getDisplayMetrics = (element: HTMLImageElement | HTMLVideoElement): DisplayMetrics => {
  const { width: displayWidth, height: displayHeight } = getContainedSize(element);
  const clientWidth = element instanceof HTMLVideoElement ? element.clientWidth : element.width;
  const clientHeight = element instanceof HTMLVideoElement ? element.clientHeight : element.height;
  return {
    displayWidth,
    displayHeight,
    offsetX: (clientWidth - displayWidth) / 2,
    offsetY: (clientHeight - displayHeight) / 2,
  };
};

export const getNaturalSize = (element: HTMLImageElement | HTMLVideoElement): { width: number; height: number } => {
  if (element instanceof HTMLVideoElement) {
    return { width: element.videoWidth, height: element.videoHeight };
  }
  return { width: element.naturalWidth, height: element.naturalHeight };
};
