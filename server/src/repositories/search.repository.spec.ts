import { Kysely } from 'kysely';
import { ConfigRepository } from 'src/repositories/config.repository';
import { PuApiRepository } from 'src/repositories/pu-api.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { DB } from 'src/schema';
import { vitest } from 'vitest';

describe(SearchRepository.name, () => {
  const logger = { setContext: vitest.fn() };
  const db = {} as Kysely<DB>;

  it('should delegate place search to PU API when external API is configured', async () => {
    const configRepository = {
      getEnv: vitest.fn().mockReturnValue({ puApiHost: 'http://pu-api' }),
    } as unknown as ConfigRepository;
    const puApiRepository = {
      searchPlaces: vitest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Amsterdam',
          latitude: 52.37,
          longitude: 4.89,
          countryCode: 'NL',
          admin1Code: null,
          admin2Code: null,
          modificationDate: '2026-05-01',
          admin1Name: 'North Holland',
          admin2Name: null,
          alternateNames: null,
        },
      ]),
    } as unknown as PuApiRepository;
    const sut = new SearchRepository(db, configRepository, puApiRepository, logger as never);

    const result = await sut.searchPlaces('amst');

    expect(puApiRepository.searchPlaces).toHaveBeenCalledWith('amst');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, name: 'Amsterdam', countryCode: 'NL' });
    expect(result[0].modificationDate).toBeInstanceOf(Date);
  });

  it('should use database fallback when external API is not configured', async () => {
    const configRepository = {
      getEnv: vitest.fn().mockReturnValue({ puApiHost: null }),
    } as unknown as ConfigRepository;
    const puApiRepository = {
      searchPlaces: vitest.fn(),
    } as unknown as PuApiRepository;
    const sut = new SearchRepository(db, configRepository, puApiRepository, logger as never);
    const fallbackSpy = vitest
      .spyOn(sut as never as { searchPlacesViaDatabase: (placeName: string) => Promise<unknown> }, 'searchPlacesViaDatabase')
      .mockResolvedValue([]);

    const result = await sut.searchPlaces('amst');

    expect(fallbackSpy).toHaveBeenCalledWith('amst');
    expect(puApiRepository.searchPlaces).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
