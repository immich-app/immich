import { afterEach, describe, expect, it, vi } from 'vitest';

type PhotoMessage = {
  type: string;
  requestId: number;
  current: { url: string };
  previous?: { url: string };
  next?: { url: string };
};

describe('Cast receiver photo switching', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('switches immediately to a prepared adjacent photo without downloading or drawing it again', async () => {
    document.body.innerHTML = `
      <div id="photos" hidden></div>
      <div id="player" hidden></div>
      <video id="video-player" hidden></video>
      <div id="brand"></div>
      <div id="spinner" hidden></div>
    `;
    const decode = vi.spyOn(Image.prototype, 'decode').mockResolvedValue(undefined);
    vi.spyOn(Image.prototype, 'naturalWidth', 'get').mockReturnValue(1600);
    vi.spyOn(Image.prototype, 'naturalHeight', 'get').mockReturnValue(900);
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
      fillRect: vi.fn(),
      drawImage,
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext);

    let onMessage: (event: { senderId: string; data: PhotoMessage }) => void = () => {};
    const playerManager = { setMessageInterceptor: vi.fn(), stop: vi.fn() };
    const context = {
      getPlayerManager: () => playerManager,
      addCustomMessageListener: (_namespace: string, listener: typeof onMessage) => (onMessage = listener),
      sendCustomMessage: vi.fn(),
      start: vi.fn(),
    };
    vi.stubGlobal('cast', {
      framework: {
        CastReceiverContext: { getInstance: () => context },
        messages: {
          MessageType: { LOAD: 'LOAD' },
          RepeatMode: { REPEAT_SINGLE: 'REPEAT_SINGLE', REPEAT_OFF: 'REPEAT_OFF' },
        },
      },
    });
    await vi.importActual('../../../../static/cast/receiver.js');

    const photos = document.querySelector('#photos')!;
    const url = (id: string) => `/api/assets/${id}/thumbnail`;
    const show = (id: string, previous?: string, next?: string) =>
      onMessage({
        senderId: 'sender',
        data: {
          type: 'SHOW_PHOTO',
          requestId: 1,
          current: { url: url(id) },
          previous: previous ? { url: url(previous) } : undefined,
          next: next ? { url: url(next) } : undefined,
        },
      });

    show('middle', 'first', 'last');
    await vi.waitFor(() => expect(photos.querySelector('canvas')).toBeTruthy());
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledTimes(3));
    expect(drawImage.mock.calls.map(([image]) => (image as HTMLImageElement).src)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(url('first')),
        expect.stringContaining(url('middle')),
        expect.stringContaining(url('last')),
      ]),
    );
    const middleFrame = photos.firstElementChild!;
    const preparedCount = drawImage.mock.calls.length;

    show('last', 'middle');
    await vi.waitFor(() => expect(photos.firstElementChild).not.toBe(middleFrame));
    expect(photos.children).toHaveLength(1);
    expect(drawImage).toHaveBeenCalledTimes(preparedCount);
    expect(decode).toHaveBeenCalledTimes(3);

    show('middle', 'first', 'last');
    await vi.waitFor(() => expect(photos.firstElementChild).toBe(middleFrame));
    expect(photos.children).toHaveLength(1);

    show('first', undefined, 'middle');
    await vi.waitFor(() => expect(photos.firstElementChild).not.toBe(middleFrame));
    expect(photos.children).toHaveLength(1);
    expect(drawImage).toHaveBeenCalledTimes(preparedCount);
    expect(decode).toHaveBeenCalledTimes(3);
  });

  it('loops video natively on the player media element when the sender repeats a single item', async () => {
    document.body.innerHTML = `
      <div id="photos" hidden></div>
      <div id="player" hidden></div>
      <video id="video-player" hidden></video>
      <div id="brand"></div>
      <div id="spinner" hidden></div>
    `;
    let onLoad: (request: unknown) => unknown = () => {};
    const playerManager = {
      setMessageInterceptor: vi.fn((_type: string, interceptor: typeof onLoad) => (onLoad = interceptor)),
      stop: vi.fn(),
    };
    const context = {
      getPlayerManager: () => playerManager,
      addCustomMessageListener: vi.fn(),
      sendCustomMessage: vi.fn(),
      start: vi.fn(),
    };
    vi.stubGlobal('cast', {
      framework: {
        CastReceiverContext: { getInstance: () => context },
        messages: {
          MessageType: { LOAD: 'LOAD' },
          RepeatMode: { REPEAT_SINGLE: 'REPEAT_SINGLE', REPEAT_OFF: 'REPEAT_OFF' },
        },
      },
    });
    await vi.importActual('../../../../static/cast/receiver.js');

    const mediaElement = document.querySelector<HTMLVideoElement>('#video-player')!;
    const player = document.querySelector<HTMLElement>('#player')!;
    expect(context.start).toHaveBeenCalledWith({ disableIdleTimeout: true, mediaElement });

    onLoad({
      media: { contentType: 'video/mp4', contentId: '/api/assets/1/video/playback', customData: { immichLoop: true } },
    });
    expect(mediaElement.loop).toBe(true);
    expect(mediaElement.hidden).toBe(false);
    expect(player.hidden).toBe(true);

    onLoad({
      media: { contentType: 'video/mp4', contentId: '/api/assets/2/video/playback' },
    });
    expect(mediaElement.loop).toBe(false);
    expect(mediaElement.hidden).toBe(false);
  });
});
