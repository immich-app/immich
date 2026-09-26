export const withCastSession = (mediaUrl: string, sessionKey: string): string => {
  const url = new URL(mediaUrl);
  url.searchParams.set('sessionKey', sessionKey);
  return url.href;
};

// Only asset video URLs have a corresponding HLS endpoint.
export const getCastHlsUrl = (mediaUrl: string): string | undefined => {
  const url = new URL(mediaUrl);
  if (!/\/assets\/[^/]+\/(?:video\/playback|original)$/.test(url.pathname)) {
    return;
  }
  url.pathname = url.pathname.replace(/\/(?:video\/playback|original)$/, '/video/stream/main.m3u8');
  return url.href;
};
