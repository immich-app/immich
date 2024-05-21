import { Inject, Injectable } from '@nestjs/common';
import semver from 'semver';
import { POSTGRES_VERSION_RANGE, VECTORS_VERSION_RANGE, VECTOR_VERSION_RANGE } from 'src/constants';
import { getVectorExtension } from 'src/database.config';
import {
  DatabaseExtension,
  DatabaseLock,
  EXTENSION_NAMES,
  IDatabaseRepository,
  VectorIndex,
} from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';

type CreateFailedArgs = { name: string; extension: string; otherName: string };
type UpdateFailedArgs = { name: string; extension: string; availableVersion: string };
type RestartRequiredArgs = { name: string; availableVersion: string };
type NightlyVersionArgs = { name: string; extension: string; version: string };
type OutOfRangeArgs = { name: string; extension: string; version: string; range: string };

const EXTENSION_RANGES = {
  [DatabaseExtension.VECTOR]: VECTOR_VERSION_RANGE,
  [DatabaseExtension.VECTORS]: VECTORS_VERSION_RANGE,
};

const messages = {
  notInstalled: (name: string) => `Unexpected: The ${name} extension is not installed.`,
  nightlyVersion: ({ name, extension, version }: NightlyVersionArgs) => `
        The ${name} extension version is ${version}, which means it is a nightly release.

        Please run 'DROP EXTENSION IF EXISTS ${extension}' and switch to a release version.
        See https://immich.app/docs/guides/database-queries for how to query the database.`,
  outOfRange: ({ name, extension, version, range }: OutOfRangeArgs) => `
        The ${name} extension version is ${version}, but Immich only supports ${range}.

        If the Postgres instance already has a compatible version installed, Immich may not have the necessary permissions to activate it.
        In this case, please run 'ALTER EXTENSION UPDATE ${extension}' manually as a superuser.
        See https://immich.app/docs/guides/database-queries for how to query the database.

        Otherwise, please update the version of ${name} in the Postgres instance to a compatible version.`,
  createFailed: ({ name, extension, otherName }: CreateFailedArgs) => `
        Failed to activate ${name} extension.
        Please ensure the Postgres instance has ${name} installed.

        If the Postgres instance already has ${name} installed, Immich may not have the necessary permissions to activate it.
        In this case, please run 'CREATE EXTENSION IF NOT EXISTS ${extension}' manually as a superuser.
        See https://immich.app/docs/guides/database-queries for how to query the database.

        Alternatively, if your Postgres instance has ${otherName}, you may use this instead by setting the environment variable 'DB_VECTOR_EXTENSION=${otherName}'.
        Note that switching between the two extensions after a successful startup is not supported.
        The exception is if your version of Immich prior to upgrading was 1.90.2 or earlier.
        In this case, you may set either extension now, but you will not be able to switch to the other extension following a successful startup.
      `,
  updateFailed: ({ name, extension, availableVersion }: UpdateFailedArgs) => `
        The ${name} extension can be updated to ${availableVersion}.
        Immich attempted to update the extension, but failed to do so.
        This may be because Immich does not have the necessary permissions to update the extension.

        Please run 'ALTER EXTENSION ${extension} UPDATE' manually as a superuser.
        See https://immich.app/docs/guides/database-queries for how to query the database.`,
  restartRequired: ({ name, availableVersion }: RestartRequiredArgs) => `
        The ${name} extension has been updated to ${availableVersion}.
        Please restart the Postgres instance to complete the update.`,
};

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(DatabaseService.name);
  }

  async init() {
    const version = await this.databaseRepository.getPostgresVersion();
    const current = semver.coerce(version);
    if (!current || !semver.satisfies(current, POSTGRES_VERSION_RANGE)) {
      throw new Error(
        `Invalid PostgreSQL version. Found ${version}, but needed ${POSTGRES_VERSION_RANGE}. Please use a supported version.`,
      );
    }

    await this.databaseRepository.withLock(DatabaseLock.Migrations, async () => {
      const extension = getVectorExtension();
      const otherExtension =
        extension === DatabaseExtension.VECTORS ? DatabaseExtension.VECTOR : DatabaseExtension.VECTORS;
      const otherName = EXTENSION_NAMES[otherExtension];
      const name = EXTENSION_NAMES[extension];
      const extensionRange = EXTENSION_RANGES[extension];

      try {
        await this.databaseRepository.createExtension(extension);
      } catch (error) {
        this.logger.fatal(messages.createFailed({ name, extension, otherName }));
        throw error;
      }

      const availableVersion = await this.databaseRepository.getAvailableExtensionVersion(extension);
      if (availableVersion && semver.satisfies(availableVersion, extensionRange)) {
        try {
          this.logger.log(`Updating ${name} extension to ${availableVersion}`);
          const { restartRequired } = await this.databaseRepository.updateVectorExtension(extension, availableVersion);
          if (restartRequired) {
            this.logger.warn(messages.restartRequired({ name, availableVersion }));
          }
        } catch (error) {
          this.logger.warn(messages.updateFailed({ name, extension, availableVersion }));
          this.logger.error(error);
        }
      }

      const version = await this.databaseRepository.getExtensionVersion(extension);
      if (!version) {
        throw new Error(messages.notInstalled(name));
      }

      if (semver.eq(version, '0.0.0')) {
        throw new Error(messages.nightlyVersion({ name, extension, version }));
      }

      if (!semver.satisfies(version, extensionRange)) {
        throw new Error(messages.outOfRange({ name, extension, version, range: extensionRange }));
      }

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

      if (process.env.DB_SKIP_MIGRATIONS !== 'true') {
        await this.databaseRepository.runMigrations();
      }
    });
  }
}
