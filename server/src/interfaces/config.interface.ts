import { RegisterQueueOptions } from '@nestjs/bullmq';
import { QueueOptions } from 'bullmq';
import { RedisOptions } from 'ioredis';
import { KyselyConfig } from 'kysely';
import { ClsModuleOptions } from 'nestjs-cls';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';
import { ImmichEnvironment, ImmichTelemetry, ImmichWorker, LogLevel } from 'src/enum';
import { DatabaseConnectionParams, VectorExtension } from 'src/interfaces/database.interface';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

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

  cls: {
    config: ClsModuleOptions;
  };

  database: {
    config: { typeorm: PostgresConnectionOptions & DatabaseConnectionParams; kysely: KyselyConfig };
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
    metrics: Set<ImmichTelemetry>;
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
  getWorker(): ImmichWorker | undefined;
}
