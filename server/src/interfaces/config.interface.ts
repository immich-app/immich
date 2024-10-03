import { ImmichEnvironment, ImmichWorker, LogLevel } from 'src/enum';
import { VectorExtension } from 'src/interfaces/database.interface';

export const IConfigRepository = 'IConfigRepository';

export interface EnvData {
  port: number;
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

  workers: ImmichWorker[];

  nodeVersion?: string;
}

export interface IConfigRepository {
  getEnv(): EnvData;
}
