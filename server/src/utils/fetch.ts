import { serverVersion } from 'src/constants';

export function configureUserAgent() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const headers = new Headers(init?.headers);
    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', `immich-server/${serverVersion}`);
    }
    return originalFetch(input, { ...init, headers });
  };
}
