import { serverVersion } from 'src/constants';
import { configureUserAgent } from 'src/utils/fetch';

describe('fetch', () => {
  it('should set the default user-agent header', async () => {
    const spy = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', spy);

    configureUserAgent();
    await fetch('https://test.local');

    const headers: Headers = spy.mock.calls[0][1].headers;
    expect(headers.get('User-Agent')).toBe(`immich-server/${serverVersion}`);

    vi.unstubAllGlobals();
  });
});
