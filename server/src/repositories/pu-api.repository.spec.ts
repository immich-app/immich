import { readFile } from 'node:fs/promises';
import { ConfigRepository } from 'src/repositories/config.repository';
import { PuApiRepository } from 'src/repositories/pu-api.repository';
import { Mocked, vitest } from 'vitest';

vitest.mock('node:fs/promises', () => ({
  readFile: vitest.fn(),
}));

describe(PuApiRepository.name, () => {
  let sut: PuApiRepository;
  let configRepository: Mocked<Pick<ConfigRepository, 'getEnv'>>;
  let logger: {
    setContext: ReturnType<typeof vitest.fn>;
    debug: ReturnType<typeof vitest.fn>;
    warn: ReturnType<typeof vitest.fn>;
    error: ReturnType<typeof vitest.fn>;
  };

  beforeEach(() => {
    configRepository = {
      getEnv: vitest.fn().mockReturnValue({
        puApiHost: 'http://pu-api',
        puTenantName: 'pond',
        puServiceAccountTokenPath: '/var/run/secrets/kubernetes.io/serviceaccount/token',
      }),
    };
    logger = {
      setContext: vitest.fn(),
      debug: vitest.fn(),
      warn: vitest.fn(),
      error: vitest.fn(),
    };
    sut = new PuApiRepository(configRepository as unknown as ConfigRepository, logger as never);
    vitest.mocked(readFile).mockResolvedValue('service-token');
    vitest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({ ok: true }),
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  it('should sync tenant users with bearer token auth', async () => {
    await sut.syncTenantUsers();

    expect(readFile).toHaveBeenCalledWith('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
    expect(global.fetch).toHaveBeenCalledWith(
      new URL('/internal/api/immich/tenant-users/sync?tenant=pond', 'http://pu-api'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer service-token' },
      }),
    );
  });

  it('should skip sync when host or tenant is missing', async () => {
    configRepository.getEnv.mockReturnValue({
      puApiHost: null,
      puTenantName: null,
      puServiceAccountTokenPath: '/var/run/secrets/kubernetes.io/serviceaccount/token',
    } as never);

    await sut.syncTenantUsers();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('Skipping PU API tenant sync, PU_API_HOST or PU_TENANT_NAME is not configured');
  });

  it('should return null request when token cannot be read', async () => {
    vitest.mocked(readFile).mockRejectedValue(new Error('not found'));

    const result = await sut.requestGeodata({
      path: '/reverse-geocode',
      query: { lat: 1.23, lon: 4.56 },
      context: 'reverse geocode',
    });

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return geodata response payload', async () => {
    vitest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        country: 'NL',
        state: 'North Holland',
        city: 'Amsterdam',
      }),
      status: 200,
      statusText: 'OK',
    } as Response);

    const result = await sut.requestGeodata<{ country: string; state: string; city: string }>({
      path: '/reverse-geocode',
      query: { lat: 52.37, lon: 4.89 },
      context: 'reverse geocode',
    });

    expect(result).toEqual({ country: 'NL', state: 'North Holland', city: 'Amsterdam' });
  });

  it('should call reverse geocode endpoint via helper method', async () => {
    const requestSpy = vitest.spyOn(sut, 'requestGeodata').mockResolvedValue({ country: null, state: null, city: null });

    await sut.reverseGeocode({ latitude: 52.37, longitude: 4.89 });

    expect(requestSpy).toHaveBeenCalledWith({
      path: '/reverse-geocode',
      query: { lat: 52.37, lon: 4.89 },
      context: 'reverse geocode',
    });
  });

  it('should call search places endpoint via helper method', async () => {
    const requestSpy = vitest.spyOn(sut, 'requestGeodata').mockResolvedValue([]);

    await sut.searchPlaces('amst');

    expect(requestSpy).toHaveBeenCalledWith({
      path: '/search-places',
      query: { q: 'amst' },
      context: 'search places',
    });
  });
});
