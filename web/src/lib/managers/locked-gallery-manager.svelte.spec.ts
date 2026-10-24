import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { LockedGalleryManager } from '$lib/managers/locked-gallery-manager.svelte';
import { unlockLockedAccess } from '$lib/services/locked-access';
import { LockedAlbumsError } from '$lib/services/locked-albums';
import { lockedMedia } from '$lib/services/locked-media';

const media = { blob: new Blob(['synthetic'], { type: 'image/jpeg' }), video: false };

describe('private gallery lifetime', () => {
  let gallery: LockedGalleryManager;
  let sequence = 0;

  beforeEach(async () => {
    vi.useFakeTimers();
    sdkMock.unlockAuthSession.mockResolvedValue(undefined as never);
    sdkMock.lockAuthSession.mockResolvedValue(undefined as never);
    await unlockLockedAccess('123456');
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:synthetic-${++sequence}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(lockedMedia, 'load').mockResolvedValue(media);
    gallery = new LockedGalleryManager(Date.now() + 60_000);
    gallery.mount();
  });

  afterEach(() => {
    gallery.destroy();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each(['SessionLocked', 'AuthLogout', 'SessionDelete', 'unmount', 'expiry'] as const)(
    'revokes every thumbnail and preview on %s',
    async (event) => {
      await gallery.load(['one', 'two']);
      await gallery.preview('one');
      const urls = [...gallery.tiles.map((tile) => tile.url), gallery.previewUrl];
      if (event === 'unmount') {
        gallery.destroy();
      } else if (event === 'expiry') {
        await vi.advanceTimersByTimeAsync(60_000);
      } else {
        eventManager.emit(event);
      }
      expect(gallery.tiles).toEqual([]);
      expect(gallery.previewId).toBe('');
      expect(gallery.previewUrl).toBe('');
      for (const url of urls) {
        expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
      }
      expect(gallery.locked).toBe(true);
    },
  );

  it('revokes old URLs on member changes and when closing/changing the viewer', async () => {
    await gallery.load(['one', 'two']);
    const thumb = gallery.tiles[0].url;
    await gallery.preview('one');
    const preview = gallery.previewUrl;
    await gallery.preview('two');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(preview);
    const secondPreview = gallery.previewUrl;
    await gallery.load(['three']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(thumb);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(secondPreview);
    expect(gallery.previewId).toBe('');
  });

  it('bounds image loading concurrency to four', () => {
    vi.mocked(lockedMedia.load).mockImplementation(() => new Promise(() => {}));
    void gallery.load(Array.from({ length: 50 }, (_, index) => `synthetic-${index}`));
    expect(lockedMedia.load).toHaveBeenCalledTimes(4);
  });

  it('discards late thumbnails after group changes and lock', async () => {
    let resolve!: (value: typeof media) => void;
    vi.mocked(lockedMedia.load).mockImplementationOnce(() => new Promise((done) => (resolve = done)));
    const pending = gallery.load(['one']);
    const signal = vi.mocked(lockedMedia.load).mock.calls[0][2];
    await gallery.load(['two']);
    expect(signal.aborted).toBe(true);
    eventManager.emit('SessionLocked');
    resolve(media);
    await pending;
    expect(gallery.tiles).toEqual([]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('discards a late preview after closing it', async () => {
    await gallery.load(['one']);
    let resolve!: (value: typeof media) => void;
    vi.mocked(lockedMedia.load).mockImplementationOnce(() => new Promise((done) => (resolve = done)));
    const pending = gallery.preview('one');
    gallery.closePreview();
    resolve(media);
    await pending;
    expect(gallery.previewUrl).toBe('');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403])('fails closed on media HTTP %s', async (status) => {
    vi.mocked(lockedMedia.load).mockRejectedValueOnce(new LockedAlbumsError(status));
    await gallery.load(['one']);
    expect(gallery.locked).toBe(true);
    expect(gallery.tiles).toEqual([]);
  });

  it('shows a generic per-photo failure without exposing error metadata', async () => {
    vi.mocked(lockedMedia.load).mockRejectedValueOnce(new Error('sensitive response'));
    await gallery.load(['one']);
    expect(gallery.tiles[0]).toEqual({ id: 'one', url: '', video: false, failed: true });
    expect(gallery.locked).toBe(false);
  });
});
