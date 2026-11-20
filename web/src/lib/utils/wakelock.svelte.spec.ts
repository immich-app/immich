import { holdWakeLock } from '#lib/utils/wakelock.svelte.ts';

const wakeLock = vi.hoisted(() => {
  const release = vi.fn();
  const request = vi.fn(() => Promise.resolve({ released: false, release } as unknown as WakeLockSentinel));
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  return { request, release };
});

describe('holdWakeLock', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the screen awake until every holder releases', async () => {
    const releaseUpload = holdWakeLock();
    const releaseVideo = holdWakeLock();
    await vi.waitFor(() => expect(wakeLock.request).toHaveBeenCalledWith('screen'));

    releaseVideo();
    expect(wakeLock.release).not.toHaveBeenCalled();

    releaseUpload();
    await vi.waitFor(() => expect(wakeLock.release).toHaveBeenCalledTimes(1));
    expect(wakeLock.request).toHaveBeenCalledTimes(1);
  });

  it('lets the screen lock when released before the lock is granted', async () => {
    holdWakeLock()();

    await vi.waitFor(() => expect(wakeLock.release).toHaveBeenCalledTimes(1));
  });
});
