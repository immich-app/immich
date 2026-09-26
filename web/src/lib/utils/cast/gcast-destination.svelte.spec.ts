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
  CastState: { IDLE: 'idle' },
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
});
