import { DatabaseExtension, ImmichEnvironment, ImmichWorker, LogFormat } from 'src/enum';
import { ConfigRepository, EnvData } from 'src/repositories/config.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

const envData: EnvData = {
  port: 2283,
  environment: ImmichEnvironment.Production,
  logFormat: LogFormat.Console,

  buildMetadata: {},
  bull: {
    config: {
      connection: {},
      prefix: 'immich_bull',
    },
    queues: [{ name: 'queue-1' }],
  },

  cls: {
    config: {},
  },

  database: {
    config: {
      connectionType: 'parts',
      database: 'immich',
      host: 'database',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
    },

    skipMigrations: false,
    vectorExtension: DatabaseExtension.Vectors,
  },

  licensePublicKey: {
    client: 'client-public-key',
    server: 'server-public-key',
  },

  network: {
    trustedProxies: [],
  },

  otel: {
    metrics: {
      hostMetrics: false,
      apiMetrics: {
        enable: false,
        ignoreRoutes: [],
      },
    },
  },

  redis: {
    host: 'redis',
    port: 6379,
    db: 0,
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
    corePlugin: '/build/corePlugin',
  },

  setup: {
    allow: true,
  },

  storage: {
    ignoreMountCheckErrors: false,
  },

  telemetry: {
    apiPort: 8081,
    microservicesPort: 8082,
    metrics: new Set(),
  },

  workers: [ImmichWorker.Api, ImmichWorker.Microservices],

  plugins: {
    external: {
      allow: true,
      installFolder: '/app/data/plugins',
    },
  },

  noColor: false,
};

export const mockEnvData = (config: Partial<EnvData>) => ({ ...envData, ...config });
export const newConfigRepositoryMock = (): Mocked<RepositoryInterface<ConfigRepository>> => {
  return {
    getEnv: vitest.fn().mockReturnValue(mockEnvData({})),
    getWorker: vitest.fn().mockReturnValue(ImmichWorker.Api),
    isDev: vitest.fn().mockReturnValue(false),
  };
};
