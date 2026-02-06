import { Injectable } from '@nestjs/common';
import semver from 'semver';
import { EXTENSION_NAMES, POSTGRES_VERSION_RANGE, VECTOR_VERSION_RANGE } from 'src/constants';
import { OnEvent } from 'src/decorators';
import { BootstrapEventPriority, DatabaseExtension, DatabaseLock } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class DatabaseService extends BaseService {
  @OnEvent({ name: 'app.bootstrap', priority: BootstrapEventPriority.DatabaseService })
  async onBootstrap() {
    const version = await this.databaseRepository.getPostgresVersion();
    const current = semver.coerce(version);
    if (!current || !semver.satisfies(current, POSTGRES_VERSION_RANGE)) {
      throw new Error(
        `Invalid PostgreSQL version. Found ${version}, but needed ${POSTGRES_VERSION_RANGE}. Please use a supported version.`,
      );
    }

    await this.databaseRepository.withLock(DatabaseLock.Migrations, async () => {
      // Ensure pgvector extension is installed
      try {
        await this.databaseRepository.createExtension(DatabaseExtension.Vector);
      } catch (error) {
        const name = EXTENSION_NAMES[DatabaseExtension.Vector];
        this.logger.fatal(`Failed to activate ${name} extension. Please ensure pgvector is installed.`);
        throw error;
      }

      // Run migrations
      const { database } = this.configRepository.getEnv();
      if (!database.skipMigrations) {
        await this.databaseRepository.runMigrations();
      }
    });
  }
}
