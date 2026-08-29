type VideoOrientationCorrection = {
  swapsDimensions: boolean;
  transform: string;
};

type VideoOrientationObserverOptions = {
  container: HTMLElement;
  orientation?: string | null;
  video: HTMLVideoElement;
};

export const getVideoOrientationCorrection = (orientation?: string | null): VideoOrientationCorrection | undefined => {
  switch (Number(orientation)) {
    case 2: {
      return { transform: 'scaleX(-1)', swapsDimensions: false };
    }
    case 3: {
      return { transform: 'rotate(180deg)', swapsDimensions: false };
    }
    case 4: {
      return { transform: 'scaleY(-1)', swapsDimensions: false };
    }
    case 5: {
      return { transform: 'rotate(-90deg) scaleX(-1)', swapsDimensions: true };
    }
    case 6: {
      return { transform: 'rotate(90deg)', swapsDimensions: true };
    }
    case 7: {
      return { transform: 'rotate(90deg) scaleX(-1)', swapsDimensions: true };
    }
    case 8: {
      return { transform: 'rotate(-90deg)', swapsDimensions: true };
    }
  }
};

export const observeVideoOrientation = ({
  container,
  orientation,
  video,
}: VideoOrientationObserverOptions): (() => void) => {
  const correction = getVideoOrientationCorrection(orientation);
  if (!correction) {
    return () => {};
  }

  const containerStyle = {
    overflow: container.style.overflow,
    position: container.style.position,
  };
  const videoStyle = {
    height: video.style.height,
    left: video.style.left,
    maxHeight: video.style.maxHeight,
    maxWidth: video.style.maxWidth,
    minHeight: video.style.minHeight,
    minWidth: video.style.minWidth,
    position: video.style.position,
    top: video.style.top,
    transform: video.style.transform,
    transformOrigin: video.style.transformOrigin,
    width: video.style.width,
  };

  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  video.style.position = 'absolute';
  video.style.left = '50%';
  video.style.top = '50%';
  video.style.minWidth = '0';
  video.style.minHeight = '0';
  video.style.maxWidth = 'none';
  video.style.maxHeight = 'none';
  video.style.transformOrigin = 'center';
  video.style.transform = `translate(-50%, -50%) ${correction.transform}`;

  const updateSize = () => {
    video.style.width = correction.swapsDimensions ? `${container.clientHeight}px` : `${container.clientWidth}px`;
    video.style.height = correction.swapsDimensions ? `${container.clientWidth}px` : `${container.clientHeight}px`;
  };
  const resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(container);
  updateSize();

  return () => {
    resizeObserver.disconnect();
    Object.assign(container.style, containerStyle);
    Object.assign(video.style, videoStyle);
  };
};
