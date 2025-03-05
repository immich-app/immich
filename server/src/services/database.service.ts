import { Injectable } from '@nestjs/common';
import semver from 'semver';
import { EXTENSION_NAMES } from 'src/constants';
import { OnEvent } from 'src/decorators';
import { BootstrapEventPriority, DatabaseExtension, DatabaseLock, VectorIndex } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { VectorExtension } from 'src/types';

type CreateFailedArgs = { name: string; extension: string; otherName: string };
type UpdateFailedArgs = { name: string; extension: string; availableVersion: string };
type RestartRequiredArgs = { name: string; availableVersion: string };
type NightlyVersionArgs = { name: string; extension: string; version: string };
type OutOfRangeArgs = { name: string; extension: string; version: string; range: string };
type InvalidDowngradeArgs = { name: string; extension: string; installedVersion: string; availableVersion: string };

const messages = {
  notInstalled: (name: string) =>
    `The ${name} extension is not available in this Postgres instance.
    If using a container image, ensure the image has the extension installed.`,
  nightlyVersion: ({ name, extension, version }: NightlyVersionArgs) => `
    The ${name} extension version is ${version}, which means it is a nightly release.

    Please run 'DROP EXTENSION IF EXISTS ${extension}' and switch to a release version.
    See https://immich.app/docs/guides/database-queries for how to query the database.`,
  outOfRange: ({ name, version, range }: OutOfRangeArgs) =>
    `The ${name} extension version is ${version}, but Immich only supports ${range}.
    Please change ${name} to a compatible version in the Postgres instance.`,
  createFailed: ({ name, extension, otherName }: CreateFailedArgs) =>
    `Failed to activate ${name} extension.
    Please ensure the Postgres instance has ${name} installed.

    If the Postgres instance already has ${name} installed, Immich may not have the necessary permissions to activate it.
    In this case, please run 'CREATE EXTENSION IF NOT EXISTS ${extension}' manually as a superuser.
    See https://immich.app/docs/guides/database-queries for how to query the database.

    Alternatively, if your Postgres instance has ${otherName}, you may use this instead by setting the environment variable 'DB_VECTOR_EXTENSION=${otherName}'.
    Note that switching between the two extensions after a successful startup is not supported.
    The exception is if your version of Immich prior to upgrading was 1.90.2 or earlier.
    In this case, you may set either extension now, but you will not be able to switch to the other extension following a successful startup.`,
  updateFailed: ({ name, extension, availableVersion }: UpdateFailedArgs) =>
    `The ${name} extension can be updated to ${availableVersion}.
    Immich attempted to update the extension, but failed to do so.
    This may be because Immich does not have the necessary permissions to update the extension.

    Please run 'ALTER EXTENSION ${extension} UPDATE' manually as a superuser.
    See https://immich.app/docs/guides/database-queries for how to query the database.`,
  restartRequired: ({ name, availableVersion }: RestartRequiredArgs) =>
    `The ${name} extension has been updated to ${availableVersion}.
    Please restart the Postgres instance to complete the update.`,
  invalidDowngrade: ({ name, installedVersion, availableVersion }: InvalidDowngradeArgs) =>
    `The database currently has ${name} ${installedVersion} activated, but the Postgres instance only has ${availableVersion} available.
    This most likely means the extension was downgraded.
    If ${name} ${installedVersion} is compatible with Immich, please ensure the Postgres instance has this available.`,
};

@Injectable()
export class DatabaseService extends BaseService {
  @OnEvent({ name: 'app.bootstrap', priority: BootstrapEventPriority.DatabaseService })
  async onBootstrap() {
    const version = await this.databaseRepository.getPostgresVersion();
    const current = semver.coerce(version);
    const postgresRange = this.databaseRepository.getPostgresVersionRange();
    if (!current || !semver.satisfies(current, postgresRange)) {
      throw new Error(
        `Invalid PostgreSQL version. Found ${version}, but needed ${postgresRange}. Please use a supported version.`,
      );
    }

    await this.databaseRepository.withLock(DatabaseLock.Migrations, async () => {
      const envData = this.configRepository.getEnv();
      const extension = envData.database.vectorExtension;
      const name = EXTENSION_NAMES[extension];
      const extensionRange = this.databaseRepository.getExtensionVersionRange(extension);

      const { availableVersion, installedVersion } = await this.databaseRepository.getExtensionVersion(extension);
      if (!availableVersion) {
        throw new Error(messages.notInstalled(name));
      }

      if ([availableVersion, installedVersion].some((version) => version && semver.eq(version, '0.0.0'))) {
        throw new Error(messages.nightlyVersion({ name, extension, version: '0.0.0' }));
      }

      if (!semver.satisfies(availableVersion, extensionRange)) {
        throw new Error(messages.outOfRange({ name, extension, version: availableVersion, range: extensionRange }));
      }

      if (!installedVersion) {
        await this.createExtension(extension);
      }

      if (installedVersion && semver.gt(availableVersion, installedVersion)) {
        await this.updateExtension(extension, availableVersion);
      } else if (installedVersion && !semver.satisfies(installedVersion, extensionRange)) {
        throw new Error(messages.outOfRange({ name, extension, version: installedVersion, range: extensionRange }));
      } else if (installedVersion && semver.lt(availableVersion, installedVersion)) {
        throw new Error(messages.invalidDowngrade({ name, extension, availableVersion, installedVersion }));
      }

      await this.checkReindexing();

      const { database } = this.configRepository.getEnv();
      if (!database.skipMigrations) {
        await this.databaseRepository.runMigrations();
      }
    });
  }

  private async createExtension(extension: DatabaseExtension) {
    try {
      await this.databaseRepository.createExtension(extension);
    } catch (error) {
      const otherExtension =
        extension === DatabaseExtension.VECTORS ? DatabaseExtension.VECTOR : DatabaseExtension.VECTORS;
      const name = EXTENSION_NAMES[extension];
      this.logger.fatal(messages.createFailed({ name, extension, otherName: EXTENSION_NAMES[otherExtension] }));
      throw error;
    }
  }

  private async updateExtension(extension: VectorExtension, availableVersion: string) {
    this.logger.log(`Updating ${EXTENSION_NAMES[extension]} extension to ${availableVersion}`);
    try {
      const { restartRequired } = await this.databaseRepository.updateVectorExtension(extension, availableVersion);
      if (restartRequired) {
        this.logger.warn(messages.restartRequired({ name: EXTENSION_NAMES[extension], availableVersion }));
      }
    } catch (error) {
      this.logger.warn(messages.updateFailed({ name: EXTENSION_NAMES[extension], extension, availableVersion }));
      throw error;
    }
  }

  private async checkReindexing() {
    try {
      if (await this.databaseRepository.shouldReindex(VectorIndex.CLIP)) {
        await this.databaseRepository.reindex(VectorIndex.CLIP);
      }

      if (await this.databaseRepository.shouldReindex(VectorIndex.FACE)) {
        await this.databaseRepository.reindex(VectorIndex.FACE);
      }
    } catch (error) {
      this.logger.warn(
        'Could not run vector reindexing checks. If the extension was updated, please restart the Postgres instance.',
      );
      throw error;
    }
  }
}
