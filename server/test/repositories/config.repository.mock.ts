import { ImmichEnvironment, ImmichWorker } from 'src/enum';
import { EnvData, IConfigRepository } from 'src/interfaces/config.interface';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { Mocked, vitest } from 'vitest';

const envData: EnvData = {
  port: 2283,
  environment: ImmichEnvironment.PRODUCTION,

  buildMetadata: {},

  database: {
    host: 'database',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    name: 'immich',

    skipMigrations: false,
    vectorExtension: DatabaseExtension.VECTORS,
  },

  licensePublicKey: {
    client: 'client-public-key',
    server: 'server-public-key',
  },

  resourcePaths: {
    lockFile: 'build-lock.json',
    geodata: {
      dateFile: '/build/geodata/geodata-date.txt',
      admin1: '/build/geodata/admin1CodesASCII.txt',
      admin2: '/build/geodata/admin2Codes.txt',
      cities500: '/build/geodata/cities500.txt',
      naturalEarthCountriesPath: 'build/ne_10m_admin_0_countries.geojson',
    },
    web: {
      root: '/build/www',
      indexHtml: '/build/www/index.html',
    },
  },

  storage: {
    ignoreMountCheckErrors: false,
  },

  workers: [ImmichWorker.API, ImmichWorker.MICROSERVICES],

  noColor: false,
};

export const newConfigRepositoryMock = (): Mocked<IConfigRepository> => {
  return {
    getEnv: vitest.fn().mockReturnValue(envData),
  };
};

export const mockEnvData = (config: Partial<EnvData>) => ({ ...envData, ...config });
