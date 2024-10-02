import { ImmichEnvironment, LogLevel } from 'src/enum';
import { VectorExtension } from 'src/interfaces/database.interface';

export const IConfigRepository = 'IConfigRepository';

export interface EnvData {
  environment: ImmichEnvironment;
  configFile?: string;
  logLevel?: LogLevel;

  database: {
    skipMigrations: boolean;
    vectorExtension: VectorExtension;
  };

  storage: {
    ignoreMountCheckErrors: boolean;
  };

  nodeVersion?: string;
}

export interface IConfigRepository {
  getEnv(): EnvData;
}
