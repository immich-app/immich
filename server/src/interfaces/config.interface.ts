import { ImmichEnvironment, ImmichWorker, LogLevel } from 'src/enum';
import { VectorExtension } from 'src/interfaces/database.interface';

export const IConfigRepository = 'IConfigRepository';

export interface EnvData {
  port: number;
  environment: ImmichEnvironment;
  configFile?: string;
  logLevel?: LogLevel;

  buildMetadata: {
    build?: string;
    buildUrl?: string;
    buildImage?: string;
    buildImageUrl?: string;
    repository?: string;
    repositoryUrl?: string;
    sourceRef?: string;
    sourceCommit?: string;
    sourceUrl?: string;
    thirdPartySourceUrl?: string;
    thirdPartyBugFeatureUrl?: string;
    thirdPartyDocumentationUrl?: string;
    thirdPartySupportUrl?: string;
  };

  database: {
    skipMigrations: boolean;
    vectorExtension: VectorExtension;
  };

  licensePublicKey: {
    client: string;
    server: string;
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
