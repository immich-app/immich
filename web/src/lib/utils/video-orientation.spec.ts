import { getVideoOrientationCorrection, observeVideoOrientation } from '$lib/utils/video-orientation';

describe('getVideoOrientationCorrection', () => {
  it.each([
    { orientation: '2', transform: 'scaleX(-1)', swapsDimensions: false },
    { orientation: '3', transform: 'rotate(180deg)', swapsDimensions: false },
    { orientation: '4', transform: 'scaleY(-1)', swapsDimensions: false },
    { orientation: '5', transform: 'rotate(-90deg) scaleX(-1)', swapsDimensions: true },
    { orientation: '6', transform: 'rotate(90deg)', swapsDimensions: true },
    { orientation: '7', transform: 'rotate(90deg) scaleX(-1)', swapsDimensions: true },
    { orientation: '8', transform: 'rotate(-90deg)', swapsDimensions: true },
  ])('maps EXIF orientation $orientation', ({ orientation, transform, swapsDimensions }) => {
    expect(getVideoOrientationCorrection(orientation)).toEqual({ transform, swapsDimensions });
  });

  it('does not transform an unrotated or missing orientation', () => {
    expect(getVideoOrientationCorrection('1')).toBeUndefined();
    expect(getVideoOrientationCorrection()).toBeUndefined();
  });
});

describe('observeVideoOrientation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('applies the correction and restores the original styles', () => {
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect = disconnect;
      },
    );
    const container = document.createElement('div');
    const video = document.createElement('video');
    container.style.position = 'fixed';
    video.style.width = '100%';
    Object.defineProperties(container, { clientWidth: { value: 800 }, clientHeight: { value: 450 } });

    const stop = observeVideoOrientation({ container, video, orientation: '8' });

    expect(container.style.position).toBe('relative');
    expect(video.style.width).toBe('450px');
    expect(video.style.height).toBe('800px');
    expect(video.style.transform).toBe('translate(-50%, -50%) rotate(-90deg)');

    stop();
    expect(container.style.position).toBe('fixed');
    expect(video.style.width).toBe('100%');
    expect(video.style.transform).toBe('');
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
