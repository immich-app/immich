export const withCastSession = (mediaUrl: string, sessionKey: string): string => {
  const url = new URL(mediaUrl);
  url.searchParams.set('sessionKey', sessionKey);
  return url.href;
};
