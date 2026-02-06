import { RegisterQueueOptions } from '@nestjs/bullmq';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { QueueOptions } from 'bullmq';
import { Request, Response } from 'express';
import { RedisOptions } from 'ioredis';
import { CLS_ID, ClsModuleOptions } from 'nestjs-cls';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';
import { join } from 'node:path';
import { excludePaths, IWorker } from 'src/constants';
import { Telemetry } from 'src/decorators';
import {
  DatabaseExtension,
  ImmichEnvironment,
  ImmichHeader,
  ImmichTelemetry,
  ImmichWorker,
  LogFormat,
  LogLevel,
  QueueName,
} from 'src/enum';
import { DatabaseConnectionParams, VectorExtension } from 'src/types';
import { setDifference } from 'src/utils/set';

export interface EnvData {
  host?: string;
  port: number;
  environment: ImmichEnvironment;
  configFile?: string;
  logLevel?: LogLevel;
  logFormat?: LogFormat;

  buildMetadata: {
    build?: string;
    buildUrl?: string;
    repository?: string;
    repositoryUrl?: string;
    sourceRef?: string;
    sourceCommit?: string;
    sourceUrl?: string;
  };

  bull: {
    config: QueueOptions;
    queues: RegisterQueueOptions[];
  };

  cls: {
    config: ClsModuleOptions;
  };

  database: {
    config: DatabaseConnectionParams;
    skipMigrations: boolean;
    vectorExtension?: VectorExtension;
  };

  network: {
    trustedProxies: string[];
  };

  otel: OpenTelemetryModuleOptions;

  resourcePaths: {
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

  workers: ImmichWorker[];

  noColor: boolean;
}

const WORKER_TYPES = new Set(Object.values(ImmichWorker));

const asSet = <T>(value: string | undefined, defaults: T[]) => {
  const values = (value || '').replaceAll(/\s/g, '').split(',').filter(Boolean);
  return new Set(values.length === 0 ? defaults : (values as T[]));
};

const getEnv = (): EnvData => {
  const env = process.env;

  const includedWorkers = asSet(env.IMMICH_WORKERS_INCLUDE, [ImmichWorker.Api, ImmichWorker.Microservices]);
  const excludedWorkers = asSet(env.IMMICH_WORKERS_EXCLUDE, []);
  const workers = [...setDifference(includedWorkers, excludedWorkers)];
  for (const worker of workers) {
    if (!WORKER_TYPES.has(worker)) {
      throw new Error(`Invalid worker(s) found: ${workers.join(',')}`);
    }
  }

  const environment = (env.IMMICH_ENV as ImmichEnvironment) || ImmichEnvironment.Production;
  const buildFolder = env.IMMICH_BUILD_DATA || '/build';
  const webFolder = join(buildFolder, 'www');

  const redisConfig: RedisOptions = {
    host: env.REDIS_HOSTNAME || 'redis',
    port: Number(env.REDIS_PORT) || 6379,
    db: Number(env.REDIS_DBINDEX) || 0,
    username: env.REDIS_USERNAME || undefined,
    password: env.REDIS_PASSWORD || undefined,
    path: env.REDIS_SOCKET || undefined,
  };

  const includedTelemetries =
    env.IMMICH_TELEMETRY_INCLUDE === 'all'
      ? new Set(Object.values(ImmichTelemetry))
      : asSet<ImmichTelemetry>(env.IMMICH_TELEMETRY_INCLUDE, []);
  const excludedTelemetries = asSet<ImmichTelemetry>(env.IMMICH_TELEMETRY_EXCLUDE, []);
  const telemetries = setDifference(includedTelemetries, excludedTelemetries);

  const databaseConnection: DatabaseConnectionParams = env.DB_URL
    ? { connectionType: 'url', url: env.DB_URL }
    : {
        connectionType: 'parts',
        host: env.DB_HOSTNAME || 'database',
        port: Number(env.DB_PORT) || 5432,
        username: env.DB_USERNAME || 'postgres',
        password: env.DB_PASSWORD || 'postgres',
        database: env.DB_DATABASE_NAME || 'immich',
        ssl: env.DB_SSL_MODE || undefined,
      };

  return {
    host: env.IMMICH_HOST,
    port: Number(env.IMMICH_PORT) || 2283,
    environment,
    configFile: env.IMMICH_CONFIG_FILE,
    logLevel: env.IMMICH_LOG_LEVEL as LogLevel | undefined,
    logFormat: (env.IMMICH_LOG_FORMAT as LogFormat) || LogFormat.Console,

    buildMetadata: {
      build: env.IMMICH_BUILD,
      buildUrl: env.IMMICH_BUILD_URL,
      repository: env.IMMICH_REPOSITORY,
      repositoryUrl: env.IMMICH_REPOSITORY_URL,
      sourceRef: env.IMMICH_SOURCE_REF,
      sourceCommit: env.IMMICH_SOURCE_COMMIT,
      sourceUrl: env.IMMICH_SOURCE_URL,
    },

    bull: {
      config: {
        prefix: 'immich_bull',
        connection: { ...redisConfig },
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      queues: Object.values(QueueName).map((name) => ({ name })),
    },

    cls: {
      config: {
        middleware: {
          mount: true,
          generateId: true,
          setup: (cls, req: Request, res: Response) => {
            const headerValues = req.headers[ImmichHeader.Cid];
            const headerValue = Array.isArray(headerValues) ? headerValues[0] : headerValues;
            const cid = headerValue || cls.get(CLS_ID);
            cls.set(CLS_ID, cid);
            res.header(ImmichHeader.Cid, cid);
          },
        },
      },
    },

    database: {
      config: databaseConnection,
      skipMigrations: env.DB_SKIP_MIGRATIONS === 'true',
      vectorExtension: DatabaseExtension.Vector,
    },

    network: {
      trustedProxies: ['linklocal', 'uniquelocal'],
    },

    otel: {
      metrics: {
        hostMetrics: telemetries.has(ImmichTelemetry.Host),
        apiMetrics: {
          enable: telemetries.has(ImmichTelemetry.Api),
          ignoreRoutes: excludePaths,
        },
      },
    },

    redis: redisConfig,

    resourcePaths: {
      web: {
        root: webFolder,
        indexHtml: join(webFolder, 'index.html'),
      },
    },

    telemetry: {
      apiPort: Number(env.IMMICH_API_METRICS_PORT) || 8081,
      microservicesPort: Number(env.IMMICH_MICROSERVICES_METRICS_PORT) || 8082,
      metrics: telemetries,
    },

    workers,
    noColor: !!env.NO_COLOR,
  };
};

let cached: EnvData | undefined;

@Injectable()
@Telemetry({ enabled: false })
export class ConfigRepository {
  constructor(@Inject(IWorker) @Optional() private worker?: ImmichWorker) {}

  getEnv() {
    if (!cached) {
      cached = getEnv();
    }
    return cached;
  }

  isDev() {
    return this.getEnv().environment === ImmichEnvironment.Development;
  }

  getWorker() {
    return this.worker;
  }
}

export const clearEnvCache = () => (cached = undefined);
