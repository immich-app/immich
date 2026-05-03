import * as gcast from './gcast-destination.svelte';

vi.mock('$lib/managers/cast-manager.svelte', () => ({
  CastDestinationType: { GCAST: 'gcast' },
  CastState: { IDLE: 'IDLE', PLAYING: 'PLAYING' },
}));

type GCastModule = typeof gcast & {
  getMediaContentType?: (mediaUrl: string) => Promise<string>;
};

class MediaInfo {
  constructor(
    public contentId: string,
    public contentType: string,
  ) {}
}

class QueueItem {
  constructor(public media: MediaInfo) {}
}

class QueueLoadRequest {
  repeatMode: string | undefined;

  constructor(public items: QueueItem[]) {}
}

const getMediaContentType = () => (gcast as GCastModule).getMediaContentType!;

const stubFetch = (contentType: string | null = 'image/jpeg') => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(undefined, {
      headers: contentType ? { 'content-type': contentType } : undefined,
    }),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

const stubChrome = () => {
  vi.stubGlobal('chrome', {
    cast: {
      media: {
        MediaInfo,
        QueueItem,
        QueueLoadRequest,
        RepeatMode: { SINGLE: 'SINGLE' },
      },
    },
  });
};

describe('getMediaContentType', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses a ranged GET request to read media headers', async () => {
    const fetchMock = stubFetch('image/jpeg');

    await expect(getMediaContentType()('/media/original.jpg')).resolves.toBe('image/jpeg');

    expect(fetchMock).toHaveBeenCalledWith('/media/original.jpg', {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
  });

  it('throws when the media response has no content type', async () => {
    stubFetch(null);

    await expect(getMediaContentType()('/media/original.jpg')).rejects.toThrow('No content type found for media url');
  });
});

describe('GCastDestination', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads media using the content type from a ranged GET probe', async () => {
    const fetchMock = stubFetch('image/heic');
    stubChrome();
    const destination = new gcast.GCastDestination();
    const queueLoad = vi.fn();

    destination.isAvailable = true;
    destination.isConnected = true;
    (destination as unknown as { session: { queueLoad: typeof queueLoad } }).session = { queueLoad };

    await destination.loadMedia('/api/assets/asset-1/original?c=cache-1', 'session-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/assets/asset-1/original?c=cache-1', {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
    expect(queueLoad).toHaveBeenCalledOnce();

    const queueRequest = queueLoad.mock.calls[0][0] as QueueLoadRequest;
    expect(queueRequest.repeatMode).toBe('SINGLE');
    expect(queueRequest.items[0].media.contentId).toBe('/api/assets/asset-1/original?c=cache-1&sessionKey=session-1');
    expect(queueRequest.items[0].media.contentType).toBe('image/heic');
  });
});
