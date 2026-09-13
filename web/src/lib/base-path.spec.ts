import { getBasePath, withBasePath } from '$lib/base-path';

describe('base path', () => {
  afterEach(() => {
    delete globalThis.__IMMICH_BASE_PATH__;
  });

  it('uses the path injected by the reverse proxy', () => {
    // eslint-disable-next-line unicorn/no-global-object-property-assignment
    globalThis.__IMMICH_BASE_PATH__ = '/immich';

    expect(getBasePath()).toBe('/immich');
    expect(withBasePath('/api')).toBe('/immich/api');
    expect(withBasePath('/immich/api')).toBe('/immich/api');
    expect(withBasePath('/auth/login?autoLaunch=0')).toBe('/immich/auth/login?autoLaunch=0');
  });

  it('keeps root deployments unchanged', () => {
    expect(getBasePath()).toBe('');
    expect(withBasePath('/api')).toBe('/api');
  });
});
