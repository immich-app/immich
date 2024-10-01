import { VectorExtension } from 'src/interfaces/database.interface';

export const IConfigRepository = 'IConfigRepository';

export interface EnvData {
  configFile?: string;
  database: {
    skipMigrations: boolean;
    vectorExtension: VectorExtension;
  };
  storage: {
    ignoreMountCheckErrors: boolean;
  };
}

export interface IConfigRepository {
  getEnv(): EnvData;
}
