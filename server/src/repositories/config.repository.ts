import { Injectable } from '@nestjs/common';
import { getVectorExtension } from 'src/database.config';
import { ImmichEnvironment, LogLevel } from 'src/enum';
import { EnvData, IConfigRepository } from 'src/interfaces/config.interface';

// TODO replace src/config validation with class-validator, here

@Injectable()
export class ConfigRepository implements IConfigRepository {
  getEnv(): EnvData {
    return {
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
    };
  }
}
