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
    url?: string;
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    skipMigrations: boolean;
    vectorExtension: VectorExtension;
  };

  licensePublicKey: {
    client: string;
    server: string;
  };

  resourcePaths: {
    lockFile: string;
    geodata: {
      dateFile: string;
      admin1: string;
      admin2: string;
      cities500: string;
      naturalEarthCountriesPath: string;
    };
    web: {
      root: string;
      indexHtml: string;
    };
  };

  storage: {
    ignoreMountCheckErrors: boolean;
  };

  workers: ImmichWorker[];

  noColor: boolean;
  nodeVersion?: string;
}

export interface IConfigRepository {
  getEnv(): EnvData;
}
