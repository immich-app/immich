import { Kysely } from 'kysely';
import { ConfigRepository } from 'src/repositories/config.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { PuApiRepository } from 'src/repositories/pu-api.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { vitest } from 'vitest';

describe(MapRepository.name, () => {
  const logger = { setContext: vitest.fn(), debug: vitest.fn(), log: vitest.fn(), verboseFn: vitest.fn(), error: vitest.fn() };
  const metadataRepository = {} as SystemMetadataRepository;
  const db = {} as Kysely<DB>;

  it('should delegate reverse geocode to PU API when external API is configured', async () => {
    const configRepository = {
      getEnv: vitest.fn().mockReturnValue({ puApiHost: 'http://pu-api' }),
    } as unknown as ConfigRepository;
    const puApiRepository = {
      reverseGeocode: vitest.fn().mockResolvedValue({ country: 'NL', state: 'NH', city: 'Amsterdam' }),
    } as unknown as PuApiRepository;
    const sut = new MapRepository(configRepository, metadataRepository, puApiRepository, logger as never, db as never);

    const result = await sut.reverseGeocode({ latitude: 1, longitude: 2 });

    expect(puApiRepository.reverseGeocode).toHaveBeenCalledWith({ latitude: 1, longitude: 2 });
    expect(result).toEqual({ country: 'NL', state: 'NH', city: 'Amsterdam' });
  });

  it('should use database fallback when external API is not configured', async () => {
    const configRepository = {
      getEnv: vitest.fn().mockReturnValue({ puApiHost: null }),
    } as unknown as ConfigRepository;
    const puApiRepository = {
      reverseGeocode: vitest.fn(),
    } as unknown as PuApiRepository;
    const sut = new MapRepository(configRepository, metadataRepository, puApiRepository, logger as never, db as never);
    const fallbackSpy = vitest
      .spyOn(sut as never as { reverseGeocodeViaDatabase: (point: { latitude: number; longitude: number }) => Promise<unknown> }, 'reverseGeocodeViaDatabase')
      .mockResolvedValue({ country: null, state: null, city: null });

    const result = await sut.reverseGeocode({ latitude: 3, longitude: 4 });

    expect(fallbackSpy).toHaveBeenCalledWith({ latitude: 3, longitude: 4 });
    expect(puApiRepository.reverseGeocode).not.toHaveBeenCalled();
    expect(result).toEqual({ country: null, state: null, city: null });
  });
});
