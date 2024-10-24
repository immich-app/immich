import { RegisterQueueOptions } from '@nestjs/bullmq';
import { QueueOptions } from 'bullmq';
import { RedisOptions } from 'ioredis';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';
import { ImmichEnvironment, ImmichWorker, LogLevel } from 'src/enum';
import { VectorExtension } from 'src/interfaces/database.interface';

export const IConfigRepository = 'IConfigRepository';

export interface EnvData {
  host?: string;
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

  bull: {
    config: QueueOptions;
    queues: RegisterQueueOptions[];
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

  network: {
    trustedProxies: string[];
  };

  otel: OpenTelemetryModuleOptions;

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

  redis: RedisOptions;

  telemetry: {
    apiPort: number;
    microservicesPort: number;
    enabled: boolean;
    apiMetrics: boolean;
    hostMetrics: boolean;
    repoMetrics: boolean;
    jobMetrics: boolean;
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
