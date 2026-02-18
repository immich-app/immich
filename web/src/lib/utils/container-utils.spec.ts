import { getContainedSize, getDisplayMetrics, getNaturalSize } from '$lib/utils/container-utils';

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

describe('getContainedSize', () => {
  it('should return full width when image is wider than container', () => {
    const img = mockImage({ naturalWidth: 2000, naturalHeight: 1000, width: 800, height: 600 });
    expect(getContainedSize(img)).toEqual({ width: 800, height: 400 });
  });

  it('should return full height when image is taller than container', () => {
    const img = mockImage({ naturalWidth: 1000, naturalHeight: 2000, width: 800, height: 600 });
    expect(getContainedSize(img)).toEqual({ width: 300, height: 600 });
  });

  it('should return exact fit when aspect ratios match', () => {
    const img = mockImage({ naturalWidth: 1600, naturalHeight: 900, width: 800, height: 450 });
    expect(getContainedSize(img)).toEqual({ width: 800, height: 450 });
  });

  it('should handle square images in landscape container', () => {
    const img = mockImage({ naturalWidth: 500, naturalHeight: 500, width: 800, height: 600 });
    expect(getContainedSize(img)).toEqual({ width: 600, height: 600 });
  });

  it('should handle square images in portrait container', () => {
    const img = mockImage({ naturalWidth: 500, naturalHeight: 500, width: 400, height: 600 });
    expect(getContainedSize(img)).toEqual({ width: 400, height: 400 });
  });

  it('should handle video elements using videoWidth/videoHeight', () => {
    const video = mockVideo({ videoWidth: 1920, videoHeight: 1080, clientWidth: 800, clientHeight: 600 });
    expect(getContainedSize(video)).toEqual({ width: 800, height: 450 });
  });

  it('should handle portrait video in landscape container', () => {
    const video = mockVideo({ videoWidth: 1080, videoHeight: 1920, clientWidth: 800, clientHeight: 600 });
    expect(getContainedSize(video)).toEqual({ width: 337.5, height: 600 });
  });
});

describe('getDisplayMetrics', () => {
  it('should compute zero offsets when aspect ratios match', () => {
    const img = mockImage({ naturalWidth: 1600, naturalHeight: 900, width: 800, height: 450 });
    expect(getDisplayMetrics(img)).toEqual({
      displayWidth: 800,
      displayHeight: 450,
      offsetX: 0,
      offsetY: 0,
    });
  });

  it('should compute horizontal letterbox offsets for tall image', () => {
    const img = mockImage({ naturalWidth: 1000, naturalHeight: 2000, width: 800, height: 600 });
    const metrics = getDisplayMetrics(img);
    expect(metrics.displayWidth).toBe(300);
    expect(metrics.displayHeight).toBe(600);
    expect(metrics.offsetX).toBe(250);
    expect(metrics.offsetY).toBe(0);
  });

  it('should compute vertical letterbox offsets for wide image', () => {
    const img = mockImage({ naturalWidth: 2000, naturalHeight: 1000, width: 800, height: 600 });
    const metrics = getDisplayMetrics(img);
    expect(metrics.displayWidth).toBe(800);
    expect(metrics.displayHeight).toBe(400);
    expect(metrics.offsetX).toBe(0);
    expect(metrics.offsetY).toBe(100);
  });

  it('should use clientWidth/clientHeight for video elements', () => {
    const video = mockVideo({ videoWidth: 1920, videoHeight: 1080, clientWidth: 800, clientHeight: 600 });
    const metrics = getDisplayMetrics(video);
    expect(metrics.displayWidth).toBe(800);
    expect(metrics.displayHeight).toBe(450);
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
