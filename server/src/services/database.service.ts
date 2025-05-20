import { Injectable } from '@nestjs/common';
import semver from 'semver';
import { EXTENSION_NAMES, VECTOR_EXTENSIONS } from 'src/constants';
import { OnEvent } from 'src/decorators';
import { BootstrapEventPriority, DatabaseExtension, DatabaseLock, VectorIndex } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { VectorExtension } from 'src/types';

type CreateFailedArgs = { name: string; extension: string };
type UpdateFailedArgs = { name: string; extension: string; availableVersion: string };
type DropFailedArgs = { name: string; extension: string };
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
  createFailed: ({ name, extension }: CreateFailedArgs) =>
    `Failed to activate ${name} extension.
    Please ensure the Postgres instance has ${name} installed.

    If the Postgres instance already has ${name} installed, Immich may not have the necessary permissions to activate it.
    In this case, please run 'CREATE EXTENSION IF NOT EXISTS ${extension} CASCADE' manually as a superuser.
    See https://immich.app/docs/guides/database-queries for how to query the database.`,
  updateFailed: ({ name, extension, availableVersion }: UpdateFailedArgs) =>
    `The ${name} extension can be updated to ${availableVersion}.
    Immich attempted to update the extension, but failed to do so.
    This may be because Immich does not have the necessary permissions to update the extension.

    Please run 'ALTER EXTENSION ${extension} UPDATE' manually as a superuser.
    See https://immich.app/docs/guides/database-queries for how to query the database.`,
  dropFailed: ({ name, extension }: DropFailedArgs) =>
    `The ${name} extension is no longer needed, but could not be dropped.
    This may be because Immich does not have the necessary permissions to drop the extension.

    Please run 'DROP EXTENSION ${extension} CASCADE;' manually as a superuser.
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
      const extension = await this.databaseRepository.getVectorExtension();
      const name = EXTENSION_NAMES[extension];
      const extensionRange = this.databaseRepository.getExtensionVersionRange(extension);

      const extensionVersions = await this.databaseRepository.getExtensionVersions(VECTOR_EXTENSIONS);
      const { installedVersion, availableVersion } = extensionVersions.find((v) => v.name === extension) ?? {};
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

      try {
        await this.databaseRepository.reindexVectorsIfNeeded([VectorIndex.CLIP, VectorIndex.FACE]);
      } catch (error) {
        this.logger.warn(
          'Could not run vector reindexing checks. If the extension was updated, please restart the Postgres instance. If you are upgrading directly from a version below 1.107.2, please upgrade to 1.107.2 first.',
        );
        throw error;
      }

      for (const { name: dbName, installedVersion } of extensionVersions) {
        const isDepended = dbName === DatabaseExtension.VECTOR && extension === DatabaseExtension.VECTORCHORD;
        if (dbName !== extension && installedVersion && !isDepended) {
          await this.dropExtension(dbName);
        }
      }

      const { database } = this.configRepository.getEnv();
      if (!database.skipMigrations) {
        await this.databaseRepository.runMigrations();
      }
      await Promise.all([
        this.databaseRepository.prewarm(VectorIndex.CLIP),
        this.databaseRepository.prewarm(VectorIndex.FACE),
      ]);
    });
  }

  private async createExtension(extension: DatabaseExtension) {
    try {
      await this.databaseRepository.createExtension(extension);
    } catch (error) {
      const name = EXTENSION_NAMES[extension];
      this.logger.fatal(messages.createFailed({ name, extension }));
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

  private async dropExtension(extension: DatabaseExtension) {
    try {
      await this.databaseRepository.dropExtension(extension);
    } catch (error) {
      const name = EXTENSION_NAMES[extension];
      this.logger.warn(messages.dropFailed({ name, extension }), error);
    }
  }
}
