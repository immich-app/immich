import { withCastSession } from '$lib/utils/cast/cast-url';

describe('withCastSession', () => {
  it.each([
    [
      'https://immich.example/assets/id/video/stream/main.m3u8',
      'https://immich.example/assets/id/video/stream/main.m3u8?sessionKey=a%2Bb',
    ],
    [
      'https://immich.example/assets/id/thumbnail?size=preview',
      'https://immich.example/assets/id/thumbnail?size=preview&sessionKey=a%2Bb',
    ],
    [
      'https://immich.example/assets/id/thumbnail?sessionKey=old',
      'https://immich.example/assets/id/thumbnail?sessionKey=a%2Bb',
    ],
  ])('adds a session to %s', (url, expected) => {
    expect(withCastSession(url, 'a+b')).toBe(expected);
  });
});
