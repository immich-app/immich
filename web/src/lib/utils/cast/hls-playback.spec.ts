import { HlsPlayback } from '../../../../static/cast/hls-playback.js';

describe('Cast HLS playback', () => {
  const root = 'https://immich.example/api/assets/video/video/stream/';
  const sessionId = '00000000-0000-4000-8000-000000000001';
  const media = { contentUrl: `${root}main.m3u8?sessionKey=a%2Bb` };
  const manifest = `#EXTM3U\n${sessionId}/0/playlist.m3u8\n`;
  let hls: HlsPlayback;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('')));
    hls = new HlsPlayback();
  });

  afterEach(() => {
    hls.release();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const configure = () => {
    hls.prepare(media);
    return hls.configure({ media }, {});
  };

  it('authenticates nested playlists and fragments only within the selected asset', () => {
    const config = configure();
    for (const resource of [`${sessionId}/0/playlist.m3u8`, `${sessionId}/0/init.mp4`, `${sessionId}/0/seg_1.m4s`]) {
      const info = { url: `${root}${resource}` };
      config.segmentRequestHandler!(info);
      expect(new URL(info.url).searchParams.get('sessionKey')).toBe('a+b');
    }
    for (const url of [
      'https://other.example/segment.m4s',
      'https://immich.example/api/assets/other/video/stream/segment.m4s',
    ]) {
      const info = { url };
      expect(() => config.manifestRequestHandler!(info)).toThrow('Unexpected Cast HLS resource');
      expect(info.url).toBe(url);
    }
  });

  it('releases the session on selection changes and rejects requests from old loads', () => {
    const config = configure();
    expect(config.manifestHandler!(manifest)).toBe(manifest);
    hls.prepare({ contentUrl: 'https://immich.example/api/assets/photo/thumbnail' });
    expect(fetch).toHaveBeenCalledWith(`${root}${sessionId}?sessionKey=a%2Bb`, { method: 'DELETE', keepalive: true });
    expect(() => config.segmentRequestHandler!({ url: `${root}${sessionId}/0/init.mp4` })).toThrow('superseded');
  });

  it('cleans up a master response that arrives after cancellation', () => {
    const config = configure();
    hls.release();
    config.manifestHandler!(manifest);
    expect(fetch).toHaveBeenCalledWith(`${root}${sessionId}?sessionKey=a%2Bb`, { method: 'DELETE', keepalive: true });
  });

  it('keeps a paused stream alive and stops heartbeats on release', async () => {
    const config = configure();
    config.segmentRequestHandler!({ url: `${root}${sessionId}/0/seg_3.m4s` });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetch).toHaveBeenCalledWith(`${root}${sessionId}/0/seg_3.m4s?sessionKey=a%2Bb`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    hls.release();
    vi.mocked(fetch).mockClear();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetch).not.toHaveBeenCalled();
  });
});
