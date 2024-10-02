import { ImmichEnvironment } from 'src/enum';
import { EnvData, IConfigRepository } from 'src/interfaces/config.interface';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { Mocked, vitest } from 'vitest';

const envData: EnvData = {
  environment: ImmichEnvironment.PRODUCTION,

  database: {
    skipMigrations: false,
    vectorExtension: DatabaseExtension.VECTORS,
  },

  storage: {
    ignoreMountCheckErrors: false,
  },
};

export const newConfigRepositoryMock = (): Mocked<IConfigRepository> => {
  return {
    getEnv: vitest.fn().mockReturnValue(envData),
  };
};

export const mockEnvData = (config: Partial<EnvData>) => ({ ...envData, ...config });
