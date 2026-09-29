import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GCastDestination } from '$lib/utils/cast/gcast-destination.svelte';

const mocks = vi.hoisted(() => ({
  auth: { authenticated: true, preferences: { cast: { gCastEnabled: true } } },
  local: { castReceiverAppId: '' },
  setOptions: vi.fn(),
  addEventListener: vi.fn(),
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({ authManager: mocks.auth }));
vi.mock('$lib/managers/user-preferences-manager.svelte', () => ({ userPreferencesManager: mocks.local }));
vi.mock('$lib/managers/cast-manager.svelte', () => ({
  CastDestinationType: { GCAST: 'gcast' },
  CastState: { IDLE: 'IDLE', BUFFERING: 'BUFFERING' },
}));

const initialize = async () => {
  const destination = new GCastDestination();
  const initialized = destination.initialize();
  const onAvailable = Reflect.get(globalThis, '__onGCastApiAvailable') as (available: boolean) => void;
  onAvailable(true);
  return initialized;
};

describe('custom receiver selection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document.body, 'append').mockImplementation(() => {});
    mocks.auth.authenticated = true;
    mocks.auth.preferences.cast.gCastEnabled = true;
    mocks.local.castReceiverAppId = '';
    mocks.setOptions.mockClear();
    mocks.addEventListener.mockClear();
    document.body.replaceChildren();
    vi.stubGlobal('chrome', { cast: { AutoJoinPolicy: { ORIGIN_SCOPED: 'origin' } } });
    Object.assign(chrome.cast, {
      media: {
        MediaInfo: class {
          constructor(
            public contentId: string,
            public contentType: string,
          ) {}
        },
        QueueItem: class {
          constructor(public media: unknown) {}
        },
        QueueLoadRequest: class {
          constructor(public items: unknown[]) {}
        },
        RepeatMode: { SINGLE: 'REPEAT_SINGLE' },
        PlayerState: { IDLE: 'IDLE', PLAYING: 'PLAYING' },
        IdleReason: { ERROR: 'ERROR' },
      },
    });
    vi.stubGlobal('cast', {
      framework: {
        CastContext: {
          getInstance: () => ({ setOptions: mocks.setOptions, addEventListener: mocks.addEventListener }),
        },
        RemotePlayer: class {},
        RemotePlayerController: class {
          addEventListener() {}
        },
        CastContextEventType: { SESSION_STATE_CHANGED: 'session' },
        SessionState: { SESSION_STARTED: 'started' },
        RemotePlayerEventType: {},
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('launches the locally configured receiver', async () => {
    mocks.local.castReceiverAppId = ' SERVER01 ';
    expect(await initialize()).toBe(true);
    expect(mocks.setOptions).toHaveBeenCalledWith({ receiverApplicationId: 'SERVER01', autoJoinPolicy: 'origin' });
  });

  it('does not load Google scripts or choose a receiver when no ID is configured', async () => {
    mocks.local.castReceiverAppId = ' '.repeat(3);
    expect(await new GCastDestination().initialize()).toBe(false);
    expect(document.querySelector('script')).toBeNull();
    expect(mocks.setOptions).not.toHaveBeenCalled();
  });

  it('does not initialize when casting is disabled', async () => {
    mocks.auth.preferences.cast.gCastEnabled = false;
    expect(await new GCastDestination().initialize()).toBe(false);
    expect(document.querySelector('script')).toBeNull();
    expect(mocks.setOptions).not.toHaveBeenCalled();
  });

  it('allows retry when the receiver reports a photo error before the send acknowledgement', async () => {
    mocks.local.castReceiverAppId = 'SERVER01';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const destination = new GCastDestination();
    const initialized = destination.initialize();
    Reflect.get(globalThis, '__onGCastApiAvailable')(true);
    await initialized;

    let onPhotoMessage: (namespace: string, message: string) => void = () => {};
    const session = {
      appId: 'SERVER01',
      receiver: { friendlyName: 'TV' },
      addMessageListener: (_namespace: string, listener: typeof onPhotoMessage) => (onPhotoMessage = listener),
      sendMessage: vi.fn((namespace: string, message: { requestId: number }, resolve: () => void) => {
        onPhotoMessage(namespace, JSON.stringify({ type: 'PHOTO_ERROR', requestId: message.requestId }));
        resolve();
      }),
    };
    const onSession = mocks.addEventListener.mock.calls.find(([type]) => type === 'session')![1];
    onSession({ sessionState: 'started', session: { getSessionObj: () => session } });

    const source = { key: 'photo', url: 'https://immich.example/api/assets/photo/thumbnail', kind: 'photo' as const };
    await destination.loadMedia(source, 'token');
    await destination.loadMedia(source, 'token');
    expect(session.sendMessage).toHaveBeenCalledTimes(2);
  });
  it('retries a failed direct video once as HLS and preserves its media identity', async () => {
    mocks.local.castReceiverAppId = 'SERVER01';
    const destination = new GCastDestination();
    const initialized = destination.initialize();
    Reflect.get(globalThis, '__onGCastApiAvailable')(true);
    await initialized;
    const session = {
      appId: 'SERVER01',
      receiver: { friendlyName: 'TV' },
      addMessageListener: vi.fn(),
      queueLoad: vi.fn((_request, _resolve, reject) => reject({ code: 'LOAD_FAILED' })),
    };
    const onSession = mocks.addEventListener.mock.calls.find(([type]) => type === 'session')![1];
    onSession({ sessionState: 'started', session: { getSessionObj: () => session } });
    await expect(
      destination.loadMedia(
        {
          key: 'video',
          url: 'https://immich.example/api/assets/video/video/playback',
          contentType: 'video/mp4',
        },
        'token',
      ),
    ).rejects.toThrow('LOAD_FAILED');
    expect(session.queueLoad).toHaveBeenCalledTimes(2);
    const [direct, hls] = session.queueLoad.mock.calls.map(([request]) => request.items[0].media);
    expect(direct.contentType).toBe('video/mp4');
    expect(hls.contentId).toBe(direct.contentId);
    expect(hls.contentType).toBe('application/vnd.apple.mpegurl');
    expect(hls.contentUrl).toBe('https://immich.example/api/assets/video/video/stream/main.m3u8?sessionKey=token');
  });
  it('keeps compatible videos direct and resumes at the last position after a playback error', async () => {
    mocks.local.castReceiverAppId = 'SERVER01';
    const destination = new GCastDestination();
    const initialized = destination.initialize();
    Reflect.get(globalThis, '__onGCastApiAvailable')(true);
    await initialized;
    const media = { playerState: 'PLAYING', currentTime: 42, idleReason: '', addUpdateListener: vi.fn() };
    const hlsMedia = { ...media, addUpdateListener: vi.fn() };
    const session = {
      appId: 'SERVER01',
      receiver: { friendlyName: 'TV' },
      addMessageListener: vi.fn(),
      queueLoad: vi
        .fn()
        .mockImplementationOnce((_request, resolve) => resolve(media))
        .mockImplementationOnce((_request, resolve) => resolve(hlsMedia)),
    };
    const onSession = mocks.addEventListener.mock.calls.find(([type]) => type === 'session')![1];
    onSession({ sessionState: 'started', session: { getSessionObj: () => session } });
    await destination.loadMedia(
      { key: 'video', url: 'https://immich.example/api/assets/video/video/playback', contentType: 'video/mp4' },
      'token',
    );
    const onUpdate = media.addUpdateListener.mock.calls[0][0];
    onUpdate(true);
    expect(session.queueLoad).toHaveBeenCalledTimes(1);
    media.playerState = 'IDLE';
    media.idleReason = 'ERROR';
    onUpdate(true);
    // A second error from the old player must not undo the fallback's loading state.
    onUpdate(true);
    expect(destination.castState).toBe('BUFFERING');
    await Promise.resolve();
    expect(session.queueLoad).toHaveBeenCalledTimes(2);
    expect(session.queueLoad.mock.calls[1][0].items[0].startTime).toBe(42);
    expect(session.queueLoad.mock.calls[1][0].items[0].media.contentType).toBe('application/vnd.apple.mpegurl');
  });
});
