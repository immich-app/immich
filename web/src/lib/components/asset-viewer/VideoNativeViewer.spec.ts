import { AssetMediaSize } from '@immich/sdk';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { autoPlayVideo } from '$lib/stores/preferences.store';
import { getAssetHlsUrl, getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
import { assetFactory } from '@test-data/factories/asset-factory';
import VideoNativeViewer from './VideoNativeViewer.svelte';

const { publicConfig } = vi.hoisted(() => ({ publicConfig: { ffmpeg: { realtime: { enabled: false } } } }));
vi.mock('$lib/queries/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/queries/client')>()),
  createPreloadedQuery: () => ({ data: publicConfig }),
}));

// Keep the controls inert: happy-dom cannot parse media-chrome's slotted CSS.
// The real Svelte player and its HTML media events are exercised below.
vi.mock('media-chrome/media-control-bar', () => ({}));
vi.mock('media-chrome/media-controller', () => ({}));
vi.mock('media-chrome/media-fullscreen-button', () => ({}));
vi.mock('media-chrome/media-mute-button', () => ({}));
vi.mock('media-chrome/media-play-button', () => ({}));
vi.mock('media-chrome/media-playback-rate-button', () => ({}));
vi.mock('media-chrome/media-time-display', () => ({}));
vi.mock('media-chrome/media-volume-range', () => ({}));
vi.mock('media-chrome/menu/media-playback-rate-menu', () => ({}));
vi.mock('media-chrome/menu/media-rendition-menu', () => ({}));
vi.mock('media-chrome/menu/media-settings-menu', () => ({}));
vi.mock('media-chrome/menu/media-settings-menu-button', () => ({}));
vi.mock('media-chrome/menu/media-settings-menu-item', () => ({}));
vi.mock('./immich-time-range', () => ({}));
vi.mock('hls-video-element', () => {
  class HlsVideoStub extends HTMLElement {
    get src() {
      return this.getAttribute('src') ?? '';
    }
    set src(value: string) {
      this.setAttribute('src', value);
    }
  }
  customElements.define('hls-video', HlsVideoStub);
  return { default: HlsVideoStub };
});

describe('original-first video playback', () => {
  const asset = assetFactory.build({ id: 'video-1', duration: 20_000, width: 1920, height: 1080 });
  const props = { asset, assetId: asset.id, cacheKey: null, loopVideo: false, playOriginalVideo: true };
  const original = getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Original, cacheKey: null });
  const playback = getAssetPlaybackUrl({ id: asset.id, cacheKey: null });

  beforeEach(() => {
    publicConfig.ffmpeg.realtime.enabled = false;
    autoPlayVideo.set(false);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const videoFrom = async (container: HTMLElement) => {
    await waitFor(() => expect(container.querySelector('video')).not.toBeNull());
    return container.querySelector('video')!;
  };

  const fail = async (video: HTMLVideoElement, code: number, source = video.src) => {
    Object.defineProperties(video, {
      currentSrc: { configurable: true, value: source },
      error: { configurable: true, value: { code } },
    });
    await fireEvent.error(video);
  };

  it('uses the original and leaves successful direct playback unchanged', async () => {
    const { container } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    expect(video.getAttribute('src')).toBe(original);
    await fireEvent.loadedMetadata(video);
    await fireEvent.canPlay(video);
    expect(video.getAttribute('src')).toBe(original);
  });

  it.each([2, 3, 4])('falls back once on a terminal media error (%s)', async (code) => {
    const { container } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    await fail(video, code);
    await waitFor(() => expect(video.getAttribute('src')).toBe(playback));
    await fail(video, code);
    expect(video.getAttribute('src')).toBe(playback);
  });

  it('does not treat an aborted load as an incompatible original', async () => {
    const { container } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    await fail(video, 1);
    expect(video.getAttribute('src')).toBe(original);
  });

  it('ignores an error from a previous asset', async () => {
    const { container } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    await fail(video, 4, 'https://example.com/previous-video');
    expect(video.getAttribute('src')).toBe(original);
  });

  it('preserves position and resumes a video the user was playing', async () => {
    const { container } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    video.currentTime = 7;
    await fireEvent.play(video);
    await fail(video, 3);
    await waitFor(() => expect(video.getAttribute('src')).toBe(playback));
    video.currentTime = 0;
    Object.defineProperty(video, 'duration', { configurable: true, value: 20 });
    await fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(7);
    await fireEvent.canPlay(video);
    expect(video.play).toHaveBeenCalledOnce();
  });

  it('does not autoplay a fallback the user had not started', async () => {
    const { container } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    await fail(video, 4);
    await waitFor(() => expect(video.getAttribute('src')).toBe(playback));
    await fireEvent.canPlay(video);
    expect(video.play).not.toHaveBeenCalled();
  });

  it('respects an explicit request for transcoded playback', async () => {
    const { container } = render(VideoNativeViewer, { ...props, playOriginalVideo: false });
    const video = await videoFrom(container);
    expect(video.getAttribute('src')).toBe(playback);
    await fail(video, 4);
    expect(video.getAttribute('src')).toBe(playback);
  });

  it('tries the next original without carrying over the previous position', async () => {
    const { container, rerender } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    video.currentTime = 7;
    await fail(video, 4);
    await waitFor(() => expect(video.getAttribute('src')).toBe(playback));
    await rerender({ ...props, assetId: 'video-2', playOriginalVideo: true });
    expect(video.getAttribute('src')).toBe(
      getAssetMediaUrl({ id: 'video-2', size: AssetMediaSize.Original, cacheKey: null }),
    );
    video.currentTime = 0;
    await fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(0);
  });

  it('tries the original before HLS and falls back to HLS when enabled', async () => {
    publicConfig.ffmpeg.realtime.enabled = true;
    const { container } = render(VideoNativeViewer, props);
    const video = await videoFrom(container);
    expect(video.getAttribute('src')).toBe(original);
    await fail(video, 4);
    await waitFor(() => expect(container.querySelector('hls-video')).not.toBeNull());
    expect(container.querySelector('hls-video')?.getAttribute('src')).toBe(getAssetHlsUrl(asset.id));
  });
});
