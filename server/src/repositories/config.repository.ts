import { Injectable } from '@nestjs/common';
import { getVectorExtension } from 'src/database.config';
import { ImmichEnvironment, ImmichWorker, LogLevel } from 'src/enum';
import { EnvData, IConfigRepository } from 'src/interfaces/config.interface';
import { setDifference } from 'src/utils/set';

// TODO replace src/config validation with class-validator, here

const WORKER_TYPES = new Set(Object.values(ImmichWorker));

const asSet = (value: string | undefined, defaults: ImmichWorker[]) => {
  const values = (value || '').replaceAll(/\s/g, '').split(',').filter(Boolean);
  return new Set(values.length === 0 ? defaults : (values as ImmichWorker[]));
};

@Injectable()
export class ConfigRepository implements IConfigRepository {
  getEnv(): EnvData {
    const included = asSet(process.env.IMMICH_WORKERS_INCLUDE, [ImmichWorker.API, ImmichWorker.MICROSERVICES]);
    const excluded = asSet(process.env.IMMICH_WORKERS_EXCLUDE, []);
    const workers = [...setDifference(included, excluded)];
    for (const worker of workers) {
      if (!WORKER_TYPES.has(worker)) {
        throw new Error(`Invalid worker(s) found: ${workers.join(',')}`);
      }
    }

    return {
      port: Number(process.env.IMMICH_PORT) || 3001,
      environment: process.env.IMMICH_ENV as ImmichEnvironment,
      configFile: process.env.IMMICH_CONFIG_FILE,
      logLevel: process.env.IMMICH_LOG_LEVEL as LogLevel,
      database: {
        skipMigrations: process.env.DB_SKIP_MIGRATIONS === 'true',
        vectorExtension: getVectorExtension(),
      },
      storage: {
        ignoreMountCheckErrors: process.env.IMMICH_IGNORE_MOUNT_CHECK_ERRORS === 'true',
      },
      workers,
    };
  }
}
