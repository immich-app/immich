import { IConfigRepository } from 'src/interfaces/config.interface';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { Mocked, vitest } from 'vitest';

export const newConfigRepositoryMock = (): Mocked<IConfigRepository> => {
  return {
    getEnv: vitest.fn().mockReturnValue({
      database: {
        skipMigration: false,
        vectorExtension: DatabaseExtension.VECTORS,
      },
    }),
  };
};
