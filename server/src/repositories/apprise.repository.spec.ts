import { AppriseError, AppriseOptions, AppriseRepository } from 'src/repositories/apprise.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { automock } from 'test/utils.js';

const options: AppriseOptions = {
  host: 'apprise.local',
  port: null,
  secure: false,
  basePath: '',
  configId: 'secret-key',
  username: '',
  password: '',
  timeout: 5,
};

const message = { title: 'title', body: 'body', urls: 'json://localhost' };

const respond = (status: number, body: object | string = {}, headers: Record<string, string> = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });

describe(AppriseRepository.name, () => {
  let sut: AppriseRepository;
  let fetchMock: ReturnType<typeof vi.fn>;

  const lastRequest = () => {
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    return { url: String(url), init: init as RequestInit & { headers: Record<string, string> } };
  };

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new AppriseRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
    fetchMock = vi.fn().mockResolvedValue(respond(200));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('url', () => {
    it('uses port 80 for http by default', async () => {
      await sut.verify(options);
      expect(lastRequest().url).toBe('http://apprise.local/status');
    });

    it('uses port 443 for https by default', async () => {
      await sut.verify({ ...options, secure: true });
      expect(lastRequest().url).toBe('https://apprise.local/status');
    });

    it('uses a custom port and base path', async () => {
      await sut.notify({ ...options, port: 8000, basePath: '/apprise/' }, message);
      expect(lastRequest().url).toBe('http://apprise.local:8000/apprise/notify');
    });

    it('supports IPv6 hosts', async () => {
      await sut.verify({ ...options, host: '::1', port: 8000 });
      expect(lastRequest().url).toBe('http://[::1]:8000/status');
    });

    it('requires a host', async () => {
      await expect(sut.verify({ ...options, host: '' })).rejects.toThrow('Host is required');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('request', () => {
    it('sends the URLs and message as JSON', async () => {
      await sut.notify(options, message);

      const { init } = lastRequest();
      expect(init.method).toBe('POST');
      expect(init.redirect).toBe('manual');
      expect(init.headers).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Apprise-Config-ID': 'secret-key',
      });
      expect(JSON.parse(init.body as string)).toEqual({
        urls: 'json://localhost',
        title: 'title',
        body: 'body',
        type: 'info',
        format: 'text',
      });
    });

    it('leaves out the config ID header when none is set', async () => {
      await sut.verify({ ...options, configId: '' });
      expect(lastRequest().init.headers).not.toHaveProperty('X-Apprise-Config-ID');
    });

    it('sends basic auth with a username and password', async () => {
      await sut.verify({ ...options, username: 'user', password: 'pass' });
      expect(lastRequest().init.headers.Authorization).toBe(`Basic ${Buffer.from('user:pass').toString('base64')}`);
    });

    it('sends basic auth with only a password', async () => {
      await sut.verify({ ...options, password: 'pass' });
      expect(lastRequest().init.headers.Authorization).toBe(`Basic ${Buffer.from(':pass').toString('base64')}`);
    });

    it('verifies with a GET request', async () => {
      await sut.verify(options);
      expect(lastRequest().init.method).toBe('GET');
      expect(lastRequest().init.body).toBeUndefined();
    });
  });

  describe('errors', () => {
    it.each([
      [302, {}, 'Unexpected redirect'],
      [400, { error: 'Bad tag' }, 'Request rejected: Bad tag'],
      [401, {}, 'Wrong username or password'],
      [403, { error: 'Persistent configuration storage is disabled' }, 'Access denied: Persistent configuration'],
      [404, { error: 'There was no configuration found' }, 'No configuration found'],
      [417, { error: 'disk full' }, 'Server problem: disk full'],
      [500, 'not json', 'Server error (500)'],
      [418, 'not json', 'Unexpected response (418)'],
    ])('maps status %s to a clear message', async (status, body, expected) => {
      fetchMock.mockResolvedValue(respond(status, body));

      const error = await sut.verify(options).catch((error) => error);
      expect(error).toBeInstanceOf(AppriseError);
      expect(error.status).toBe(status);
      expect(error.message).toContain(expected);
    });

    it('lists failed services on a partial failure', async () => {
      fetchMock.mockResolvedValue(
        respond(424, {
          error: 'One or more notification could not be sent',
          details: [
            ['INFO', 'time', 'Sent Discord notification.'],
            ['WARNING', 'time', 'Failed to send ntfy notification.'],
          ],
        }),
      );

      await expect(sut.notify(options, message)).rejects.toThrow(
        'Some services failed: Failed to send ntfy notification.',
      );
    });

    it('includes Retry-After when the server is busy', async () => {
      fetchMock.mockResolvedValue(respond(503, {}, { 'Retry-After': '30' }));
      await expect(sut.notify(options, message)).rejects.toThrow('Server error (503), retry after 30s');
    });

    it('reports a timeout', async () => {
      fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'));
      await expect(sut.notify(options, message)).rejects.toThrow('No response within 5s');
    });

    it('reports a refused connection', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }));
      await expect(sut.verify(options)).rejects.toThrow('Cannot connect to apprise.local:80 (ECONNREFUSED)');
    });

    it('never includes the config ID or password in messages', async () => {
      fetchMock.mockResolvedValue(respond(401));

      const error = await sut.verify({ ...options, password: 'hunter2' }).catch((error) => error);
      expect(error.message).not.toContain('secret-key');
      expect(error.message).not.toContain('hunter2');
    });
  });
});
