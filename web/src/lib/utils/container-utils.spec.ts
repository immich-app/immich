import { getContentMetrics, getNaturalSize, scaleToFit } from '$lib/utils/container-utils';

const mockImage = (props: {
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
}): HTMLImageElement => props as unknown as HTMLImageElement;

const mockVideo = (props: {
  videoWidth: number;
  videoHeight: number;
  clientWidth: number;
  clientHeight: number;
}): HTMLVideoElement => {
  const element = Object.create(HTMLVideoElement.prototype);
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(element, key, { value, writable: true, configurable: true });
  }
  return element;
};

describe('scaleToFit', () => {
  it('should return full width when image is wider than container', () => {
    expect(scaleToFit({ width: 2000, height: 1000 }, { width: 800, height: 600 })).toEqual({ width: 800, height: 400 });
  });

  it('should return full height when image is taller than container', () => {
    expect(scaleToFit({ width: 1000, height: 2000 }, { width: 800, height: 600 })).toEqual({ width: 300, height: 600 });
  });

  it('should return exact fit when aspect ratios match', () => {
    expect(scaleToFit({ width: 1600, height: 900 }, { width: 800, height: 450 })).toEqual({ width: 800, height: 450 });
  });

  it('should handle square images in landscape container', () => {
    expect(scaleToFit({ width: 500, height: 500 }, { width: 800, height: 600 })).toEqual({ width: 600, height: 600 });
  });

  it('should handle square images in portrait container', () => {
    expect(scaleToFit({ width: 500, height: 500 }, { width: 400, height: 600 })).toEqual({ width: 400, height: 400 });
  });
});

describe('getContentMetrics', () => {
  it('should compute zero offsets when aspect ratios match', () => {
    const img = mockImage({ naturalWidth: 1600, naturalHeight: 900, width: 800, height: 450 });
    expect(getContentMetrics(img)).toEqual({
      contentWidth: 800,
      contentHeight: 450,
      offsetX: 0,
      offsetY: 0,
    });
  });

  it('should compute horizontal letterbox offsets for tall image', () => {
    const img = mockImage({ naturalWidth: 1000, naturalHeight: 2000, width: 800, height: 600 });
    const metrics = getContentMetrics(img);
    expect(metrics.contentWidth).toBe(300);
    expect(metrics.contentHeight).toBe(600);
    expect(metrics.offsetX).toBe(250);
    expect(metrics.offsetY).toBe(0);
  });

  it('should compute vertical letterbox offsets for wide image', () => {
    const img = mockImage({ naturalWidth: 2000, naturalHeight: 1000, width: 800, height: 600 });
    const metrics = getContentMetrics(img);
    expect(metrics.contentWidth).toBe(800);
    expect(metrics.contentHeight).toBe(400);
    expect(metrics.offsetX).toBe(0);
    expect(metrics.offsetY).toBe(100);
  });

  it('should use clientWidth/clientHeight for video elements', () => {
    const video = mockVideo({ videoWidth: 1920, videoHeight: 1080, clientWidth: 800, clientHeight: 600 });
    const metrics = getContentMetrics(video);
    expect(metrics.contentWidth).toBe(800);
    expect(metrics.contentHeight).toBe(450);
    expect(metrics.offsetX).toBe(0);
    expect(metrics.offsetY).toBe(75);
  });
});

describe('getNaturalSize', () => {
  it('should return naturalWidth/naturalHeight for images', () => {
    const img = mockImage({ naturalWidth: 4000, naturalHeight: 3000, width: 800, height: 600 });
    expect(getNaturalSize(img)).toEqual({ width: 4000, height: 3000 });
  });

  it('should return videoWidth/videoHeight for videos', () => {
    const video = mockVideo({ videoWidth: 1920, videoHeight: 1080, clientWidth: 800, clientHeight: 600 });
    expect(getNaturalSize(video)).toEqual({ width: 1920, height: 1080 });
  });
});
