import { vectorExtension } from '@app/infra/database.config';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Version, VersionType } from '../domain.constant';
import { DatabaseExtension, IDatabaseRepository } from '../repositories';

@Injectable()
export class DatabaseService {
  private logger = new ImmichLogger(DatabaseService.name);
  minPostgresVersion = 14;
  minVectorsVersion = new Version(0, 2, 0);
  maxVectorsVersion: Version | VersionType = VersionType.MINOR;
  minVectorVersion = new Version(0, 5, 0);
  maxVectorVersion: Version | VersionType = VersionType.MAJOR;
  extName = vectorExtension === DatabaseExtension.VECTOR ? 'pgvector' : 'pgvecto.rs';

  constructor(@Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository) {}

  async init() {
    await this.assertPostgresql();
    await this.createVectorExtension();
    await this.assertVectorExtension();
    await this.databaseRepository.runMigrations();
  }

  private async assertVectorExtension() {
    const version = await this.databaseRepository.getExtensionVersion(vectorExtension);
    if (version == null) {
      throw new Error(`Unexpected: The ${this.extName} extension is not installed.`);
    }

    // if (version.isEqual(new Version(0, 0, 0))) {
    //   throw new Error(
    //     `The pgvecto.rs extension version is ${version}, which means it is a nightly release.` +
    //       `Please run 'DROP EXTENSION IF EXISTS vectors' and switch to a release version.`,
    //   );
    // }

    const minVersion = vectorExtension === DatabaseExtension.VECTOR ? this.minVectorVersion : this.minVectorsVersion;
    const maxVersion = vectorExtension === DatabaseExtension.VECTOR ? this.maxVectorVersion : this.maxVectorsVersion;

    if (maxVersion instanceof Version) {
      if (version.isNewerThan(maxVersion)) {
        this.logger.fatal(`
        The ${this.extName} extension version is ${version} instead of ${maxVersion}.
        Please run 'DROP EXTENSION IF EXISTS ${vectorExtension}' and switch to ${maxVersion}.`);
        throw new Error();
      }
    } else if (version.isOlderThan(minVersion) || version.isNewerThan(minVersion, maxVersion)) {
      const releases =
        maxVersion !== VersionType.PATCH
          ? `${minVersion} and later ${VersionType[maxVersion + 1].toLowerCase()} releases`
          : minVersion.toString();

      this.logger.fatal(`
        The ${this.extName} extension version is ${version}, but Immich only supports ${releases}.
        Please run 'DROP EXTENSION IF EXISTS ${vectorExtension}' and switch to a compatible version.`);
      throw new Error();
    }
  }

  private async createVectorExtension() {
    await this.databaseRepository.createExtension(vectorExtension).catch(async (error: QueryFailedError) => {
      this.logger.fatal(`
        Failed to create ${this.extName} extension.
        If you have not updated your Postgres instance to a docker image that supports ${this.extName}, please do so.
        If the Postgres instance already has ${this.extName} installed, Immich may not have the necessary permissions to activate it.
        In this case, please run 'CREATE EXTENSION IF NOT EXISTS ${vectorExtension}' manually as a superuser.
      `);
      throw err;
    });
  }

  private async assertPostgresql() {
    const { major } = await this.databaseRepository.getPostgresVersion();
    if (major < this.minPostgresVersion) {
      throw new Error(`
        The PostgreSQL version is ${major}, which is older than the minimum supported version ${this.minPostgresVersion}.
        Please upgrade to this version or later.`);
    }
  }
}
