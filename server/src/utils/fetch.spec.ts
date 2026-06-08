import { serverVersion } from 'src/constants';
import { configureUserAgent } from 'src/utils/fetch';

describe('fetch', () => {
  it('should set the default user-agent header', async () => {
    const spy = vi.fn().mockResolvedValue(new Response());
    const original = globalThis.fetch;
    globalThis.fetch = spy;

    configureUserAgent();
    await globalThis.fetch('http://test.local');

    const headers: Headers = spy.mock.calls[0][1].headers;
    expect(headers.get('User-Agent')).toBe(`immich-server/${serverVersion}`);

    globalThis.fetch = original;
  });
});
