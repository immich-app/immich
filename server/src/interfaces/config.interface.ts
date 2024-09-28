import { VectorExtension } from 'src/interfaces/database.interface';

export const IConfigRepository = 'IConfigRepository';

export interface EnvData {
  database: {
    skipMigrations: boolean;
    vectorExtension: VectorExtension;
  };
}

export interface IConfigRepository {
  getEnv(): EnvData;
}
