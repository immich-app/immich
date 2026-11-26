import { getAppVersionFromUA, isSensitiveKey, redactUrl } from 'src/utils/request.js';

describe(getAppVersionFromUA.name, () => {
  it('should get the app version for android', () => {
    expect(getAppVersionFromUA('immich-android/1.123.4')).toEqual('1.123.4');
  });

  it('should get the app version for ios', () => {
    expect(getAppVersionFromUA('immich-ios/1.123.4')).toEqual('1.123.4');
  });

  it('should get the app version for unknown', () => {
    expect(getAppVersionFromUA('immich-unknown/1.123.4')).toEqual('1.123.4');
  });
});

describe(redactUrl.name, () => {
  it.each([
    ['/api/assets/1/video/playback?sessionKey=secret', '/api/assets/1/video/playback?sessionKey=********'],
    ['/api/assets/1/original?key=secret&edited=true', '/api/assets/1/original?key=********&edited=true'],
    [
      '/api/timeline/buckets?visibility=timeline&slug=secret',
      '/api/timeline/buckets?visibility=timeline&slug=********',
    ],
    ['/api/albums?apiKey=secret', '/api/albums?apiKey=********'],
    ['/api/oauth/mobile-redirect?code=secret&state=abc', '/api/oauth/mobile-redirect?code=********&state=abc'],
  ])('should redact %s', (url, expected) => {
    expect(redactUrl(url)).toEqual(expected);
  });

  it.each(['/api/albums', '/api/search/suggestions?type=country&monkey=1', '/api/assets?key'])(
    'should not change %s',
    (url) => {
      expect(redactUrl(url)).toEqual(url);
    },
  );
});

describe(isSensitiveKey.name, () => {
  it.each([
    'password',
    'newPassword',
    'pinCode',
    'newPinCode',
    'token',
    'logout_token',
    'clientSecret',
    'codeVerifier',
  ])('should match %s', (key) => {
    expect(isSensitiveKey(key)).toBe(true);
  });

  it.each(['key', 'name', 'email', 'assetIds'])('should not match %s', (key) => {
    expect(isSensitiveKey(key)).toBe(false);
  });
});
