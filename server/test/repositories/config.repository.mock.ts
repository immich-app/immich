import { ImmichEnvironment, ImmichWorker } from 'src/enum';
import { EnvData, IConfigRepository } from 'src/interfaces/config.interface';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { Mocked, vitest } from 'vitest';

const envData: EnvData = {
  port: 3001,
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
