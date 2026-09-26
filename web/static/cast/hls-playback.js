/**
 * @typedef {{contentUrl?: string, contentId?: string}} Media
 * @typedef {{url: string, timeoutInterval?: number}} NetworkRequest
 * @typedef {{manifestRequestHandler?: (info: NetworkRequest) => void,
 * segmentRequestHandler?: (info: NetworkRequest) => void,
 * manifestHandler?: (manifest: string) => string}} PlaybackConfig
 * @typedef {{url: URL, root: URL, token: string, sessions: Set<string>,
 * segment: string | null, timer: ReturnType<typeof setInterval> | null}} Stream
 */
// HLS playlists use relative URLs, which do not inherit the master URL's token.
// Keep credentials and cleanup scoped to the load that created each stream.
export class HlsPlayback {
  /** @type {Stream | null} */
  active = null;

  /** @param {Media | undefined} media */
  prepare(media) {
    this.release();
    const source = media?.contentUrl || media?.contentId;
    if (!source) {
      return;
    }
    const url = new URL(source, location.href);
    if (!/\/assets\/[^/]+\/video\/stream\/main\.m3u8$/.test(url.pathname)) {
      return;
    }
    const token = url.searchParams.get('sessionKey');
    if (!token) {
      return;
    }
    /** @type {Stream} */
    const stream = {
      url,
      root: new URL('./', url),
      token,
      sessions: new Set(),
      segment: null,
      timer: null,
    };
    // Pausing or looping buffered media can outlast the server's five-minute
    // inactivity lease. HEAD renews it without downloading the segment again.
    stream.timer = setInterval(() => {
      if (stream.segment) {
        void fetch(stream.segment, { method: 'HEAD', cache: 'no-store' }).catch(() => {});
      }
    }, 60_000);
    this.active = stream;
  }

  /** @param {{media?: Media}} request @param {PlaybackConfig} config */
  configure(request, config) {
    const stream = this.active;
    if (!stream || request.media?.contentUrl !== stream.url.href) {
      return config;
    }
    /** @param {NetworkRequest} info */
    const authenticate = (info) => {
      const url = new URL(info.url, stream.root);
      // Never forward the Cast token outside this asset's stream endpoints.
      if (url.origin !== stream.root.origin || !url.pathname.startsWith(stream.root.pathname)) {
        throw new Error('Unexpected Cast HLS resource');
      }
      if (this.active !== stream) {
        throw new Error('Cast HLS load was superseded');
      }
      url.searchParams.set('sessionKey', stream.token);
      info.url = url.href;
      info.timeoutInterval = 60_000;
    };
    config.manifestRequestHandler = authenticate;
    config.segmentRequestHandler = (info) => {
      authenticate(info);
      stream.segment = info.url;
    };
    config.manifestHandler = (manifest) => {
      // The master response creates the session, even if playback is cancelled
      // before the first variant request. Retire late responses immediately.
      for (const line of manifest.split(/\r?\n/)) {
        const match = /^([\da-f-]{36})\/\d+\/playlist\.m3u8$/.exec(line.trim());
        if (!match) {
          continue;
        }
        const url = new URL(match[1], stream.root);
        url.searchParams.set('sessionKey', stream.token);
        stream.sessions.add(url.href);
      }
      if (this.active !== stream) {
        this.releaseSessions(stream);
      }
      return manifest;
    };
    return config;
  }

  /** @param {Stream} stream */
  releaseSessions(stream) {
    for (const url of stream.sessions) {
      void fetch(url, { method: 'DELETE', keepalive: true }).catch(() => {});
    }
    stream.sessions.clear();
  }

  release() {
    const stream = this.active;
    this.active = null;
    if (stream) {
      if (stream.timer !== null) {
        clearInterval(stream.timer);
      }
      this.releaseSessions(stream);
    }
  }
}
