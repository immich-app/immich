import { BadRequestException } from '@nestjs/common';
import { AppriseOptions, AppriseRepository } from 'src/repositories/apprise.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { automock } from 'test/utils.js';

const options: AppriseOptions = {
  url: 'http://apprise.local',
  configId: 'secret-key',
  username: '',
  password: '',
  timeout: 5,
};

const message = { title: 'title', body: 'body', urls: ['json://localhost'] };

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
    it('adds the route to the server URL', async () => {
      await sut.verify(options);
      expect(lastRequest().url).toBe('http://apprise.local/status');
    });

    it('keeps a port and path prefix', async () => {
      await sut.notify({ ...options, url: 'https://apprise.local:8443/apprise' }, message);
      expect(lastRequest().url).toBe('https://apprise.local:8443/apprise/notify');
    });

    it('accepts a trailing slash', async () => {
      await sut.verify({ ...options, url: 'http://apprise.local/apprise/' });
      expect(lastRequest().url).toBe('http://apprise.local/apprise/status');
    });

    it('requires a URL', async () => {
      await expect(sut.verify({ ...options, url: '' })).rejects.toThrow('URL is required');
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
        urls: ['json://localhost'],
        title: 'title',
        body: 'body',
        type: 'info',
        format: 'text',
      });
    });

    it('sends a custom notification type', async () => {
      await sut.notify(options, { ...message, type: 'failure' });
      expect(JSON.parse(lastRequest().init.body as string).type).toBe('failure');
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

    it('rejects a server with stateless notifications turned off', async () => {
      fetchMock.mockResolvedValue(respond(200, { stateless_enabled: false }));
      await expect(sut.verify(options)).rejects.toThrow('Stateless notifications are turned off');
    });

    it.each(['locked', 'public', 'disabled'])('rejects a configuration login with %s access', async (access) => {
      fetchMock
        .mockResolvedValueOnce(respond(200, { privilege: 'user', stateless_enabled: true }))
        .mockResolvedValueOnce(respond(200, { access }));

      await expect(sut.verify(options)).rejects.toThrow(`not allowed for this login (access: ${access})`);
      expect(lastRequest().url).toBe('http://apprise.local/auth');
    });

    it('accepts a configuration login with user access', async () => {
      fetchMock
        .mockResolvedValueOnce(respond(200, { privilege: 'user', stateless_enabled: true }))
        .mockResolvedValueOnce(respond(200, { access: 'user' }));

      await expect(sut.verify(options)).resolves.toBeUndefined();
    });

    it('does not check access for an admin login or an older server', async () => {
      fetchMock.mockResolvedValueOnce(respond(200, { privilege: 'admin' })).mockResolvedValueOnce(respond(200, {}));

      await sut.verify(options);
      await sut.verify(options);
      expect(fetchMock).toHaveBeenCalledTimes(2);
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
      expect(error).toBeInstanceOf(BadRequestException);
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
      await expect(sut.verify(options)).rejects.toThrow('Cannot connect to apprise.local (ECONNREFUSED)');
    });

    it('never includes credentials or a query from the URL in messages', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const error = await sut
        .verify({ ...options, url: 'https://admin:hunter2@apprise.local:8443/?token=abc' })
        .catch((error) => error);
      expect(error.message).toBe('Cannot connect to apprise.local:8443');
    });

    it('never includes the config ID or password in messages', async () => {
      fetchMock.mockResolvedValue(respond(401));

      const error = await sut.verify({ ...options, password: 'hunter2' }).catch((error) => error);
      expect(error.message).not.toContain('secret-key');
      expect(error.message).not.toContain('hunter2');
    });
  });
});
