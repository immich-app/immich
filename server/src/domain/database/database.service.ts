import { vectorExt } from '@app/infra/database.config';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Version, VersionType } from '../domain.constant';
import { DatabaseExtension, IDatabaseRepository, extName } from '../repositories';

@Injectable()
export class DatabaseService {
  private logger = new ImmichLogger(DatabaseService.name);
  minPostgresVersion = 14;
  minVectorsVersion = new Version(0, 0, 0);
  maxVectorsVersion: Version | VersionType = VersionType.MINOR;
  minVectorVersion = new Version(0, 5, 0);
  maxVectorVersion: Version | VersionType = VersionType.MAJOR;

  constructor(@Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository) {}

  async init() {
    await this.assertPostgresql();
    await this.createVectorExtension();
    await this.updateVectorExtension();
    await this.assertVectorExtension();
    await this.databaseRepository.runMigrations();
  }

  private async assertPostgresql() {
    const { major } = await this.databaseRepository.getPostgresVersion();
    if (major < this.minPostgresVersion) {
      throw new Error(`
        The PostgreSQL version is ${major}, which is older than the minimum supported version ${this.minPostgresVersion}.
        Please upgrade to this version or later.`);
    }
  }

  private async createVectorExtension() {
    await this.databaseRepository.createExtension(vectorExt).catch(async (err: QueryFailedError) => {
      const otherExt = vectorExt === DatabaseExtension.VECTORS ? DatabaseExtension.VECTOR : DatabaseExtension.VECTORS;
      this.logger.fatal(`
        Failed to activate the ${extName[vectorExt]} extension.
        Please ensure the Postgres instance has ${extName[vectorExt]} installed.
        If the Postgres instance already has ${extName[vectorExt]} installed, Immich may not have the necessary permissions to activate it.
        In this case, please run 'CREATE EXTENSION IF NOT EXISTS ${vectorExt}' manually as a superuser.

        Alternatively, if your Postgres instance has ${extName[otherExt]}, you may switch to this by setting the environment variable IMMICH_VECTOR_EXTENSION=${otherExt}
      `);
      throw err;
    });
  }

  private async updateVectorExtension() {
    const [version, availableVersion] = await Promise.all([
      this.databaseRepository.getExtensionVersion(vectorExt),
      this.databaseRepository.getAvailableExtensionVersion(vectorExt),
    ]);
    if (version == null || availableVersion == null) {
      throw new Error(`Unexpected: The ${extName[vectorExt]} extension is not installed.`);
    }

    if (availableVersion.isNewerThan(version)) {
      try {
        this.databaseRepository.updateExtension(vectorExt, availableVersion);
      } catch (err) {
        this.logger.warn(`
          The ${extName[vectorExt]} extension version is ${version}, but ${availableVersion} is available.
          Immich attempted to update the extension, but failed to do so.
          This may be because Immich does not have the necessary permissions to update the extension.
          Please run 'ALTER EXTENSION ${vectorExt} UPDATE' manually as a superuser.`);
      }
    }
  }

  private async assertVectorExtension() {
    const version = await this.databaseRepository.getExtensionVersion(vectorExt);
    if (version == null) {
      throw new Error(`Unexpected: The ${extName[vectorExt]} extension is not installed.`);
    }

    // if (version.isEqual(new Version(0, 0, 0))) {
    //   throw new Error(
    //     `The pgvecto.rs extension version is ${version}, which means it is a nightly release.` +
    //       `Please run 'DROP EXTENSION IF EXISTS vectors' and switch to a release version.`,
    //   );
    // }

    const minVersion = vectorExt === DatabaseExtension.VECTOR ? this.minVectorVersion : this.minVectorsVersion;
    const maxVersion = vectorExt === DatabaseExtension.VECTOR ? this.maxVectorVersion : this.maxVectorsVersion;

    if (maxVersion instanceof Version) {
      if (version.isNewerThan(maxVersion)) {
        this.logger.fatal(`
        The ${extName[vectorExt]} extension version is ${version}. This is newer than ${maxVersion}, the current maximum supported version.
        Please run 'DROP EXTENSION IF EXISTS ${vectorExt}' and switch to ${maxVersion}.`);
        throw new Error();
      }
    } else if (version.isOlderThan(minVersion) || version.isNewerThan(minVersion, maxVersion)) {
      const releases =
        maxVersion !== VersionType.PATCH
          ? `${minVersion} and later ${VersionType[maxVersion + 1].toLowerCase()} releases`
          : minVersion.toString();

      this.logger.fatal(`
        The ${extName[vectorExt]} extension version is ${version}, but Immich only supports ${releases}.
        If the Postgres instance already has a compatible version installed, Immich may not have the necessary permissions to activate it.
        In this case, please run 'ALTER EXTENSION UPDATE ${vectorExt}' manually as a superuser.
        Otherwise, please update the version of ${extName[vectorExt]} in the Postgres instance to a compatible version.`);
      throw new Error();
    }
  }
}
