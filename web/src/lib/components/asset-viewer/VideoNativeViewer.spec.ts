import { queryClient } from '#lib/queries/client.ts';
import { getPublicConfigQuery } from '#lib/queries/config-public.query.ts';
import { payload } from '#test/medium/mock/payloads.ts';
import { factory } from '#test/unit/factories.ts';
import { AssetTypeEnum } from '@immich/sdk';
import { render, waitFor } from '@testing-library/svelte';
import VideoNativeViewer from './VideoNativeViewer.svelte';

const wakeLock = vi.hoisted(() => {
  const release = vi.fn();
  const request = vi.fn(() => Promise.resolve({ released: false, release } as unknown as WakeLockSentinel));
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  return { request, release };
});

vi.mock('media-chrome/media-controller', () => ({}));
vi.mock('media-chrome/media-volume-range', () => ({}));
vi.mock('./immich-time-range', () => ({}));

describe('VideoNativeViewer', () => {
  const renderVideo = async () => {
    const asset = factory.asset({ type: AssetTypeEnum.Video });
    const result = render(VideoNativeViewer, {
      asset,
      assetId: asset.id,
      loopVideo: true,
      cacheKey: null,
      playOriginalVideo: false,
    });
    const video = await waitFor(() => result.container.querySelector('video')!);
    return { ...result, video };
  };

  beforeEach(() => {
    queryClient.setQueryData(getPublicConfigQuery().queryKey, payload.publicConfig());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the screen awake while the video plays', async () => {
    const { video } = await renderVideo();
    expect(wakeLock.request).not.toHaveBeenCalled();

    await video.play();

    await waitFor(() => expect(wakeLock.request).toHaveBeenCalledWith('screen'));
  });

  it('lets the screen lock when the video pauses', async () => {
    const { video } = await renderVideo();
    await video.play();
    await waitFor(() => expect(wakeLock.request).toHaveBeenCalled());

    video.pause();

    await waitFor(() => expect(wakeLock.release).toHaveBeenCalledTimes(1));
  });

  it('lets the screen lock when the viewer closes during playback', async () => {
    const { video, unmount } = await renderVideo();
    await video.play();
    await waitFor(() => expect(wakeLock.request).toHaveBeenCalled());

    unmount();

    await waitFor(() => expect(wakeLock.release).toHaveBeenCalledTimes(1));
  });

  it('lets the screen lock when switching to another video during playback', async () => {
    const { video, rerender } = await renderVideo();
    await video.play();
    await waitFor(() => expect(wakeLock.request).toHaveBeenCalled());

    const nextAsset = factory.asset({ type: AssetTypeEnum.Video });
    await rerender({ asset: nextAsset, assetId: nextAsset.id });

    await waitFor(() => expect(wakeLock.release).toHaveBeenCalledTimes(1));
  });
});
