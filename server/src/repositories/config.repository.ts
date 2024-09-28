import { Injectable } from '@nestjs/common';
import { getVectorExtension } from 'src/database.config';
import { EnvData, IConfigRepository } from 'src/interfaces/config.interface';

@Injectable()
export class ConfigRepository implements IConfigRepository {
  getEnv(): EnvData {
    return {
      database: {
        skipMigrations: process.env.DB_SKIP_MIGRATIONS === 'true',
        vectorExtension: getVectorExtension(),
      },
    };
  }
}
