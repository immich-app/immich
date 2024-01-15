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

  constructor(@Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository) {}

  async init() {
    await this.assertPostgresql();
    await this.createVectors();
    await this.assertVectors();
    await this.databaseRepository.runMigrations();
  }

  private async assertVectors() {
    const version = await this.databaseRepository.getExtensionVersion(DatabaseExtension.VECTORS);
    if (version == null) {
      throw new Error('Unexpected: The pgvecto.rs extension is not installed.');
    }

    const image = await this.getVectorsImage();
    const suggestion = image ? `, such as with the docker image '${image}'` : '';

    // if (version.isEqual(new Version(0, 0, 0))) {
    //   throw new Error(
    //     `The pgvecto.rs extension version is ${version}, which means it is a nightly release.` +
    //       `Please run 'DROP EXTENSION IF EXISTS vectors' and switch to a release version${suggestion}.`,
    //   );
    // }

    if (this.maxVectorsVersion instanceof Version) {
      if (version.isNewerThan(this.maxVectorsVersion)) {
        throw new Error(`
        The pgvecto.rs extension version is ${version} instead of ${this.maxVectorsVersion}.
        Please run 'DROP EXTENSION IF EXISTS vectors' and switch to ${this.maxVectorsVersion}${suggestion}.`);
      }
    } else if (version.isNewerThan(this.minVectorsVersion, this.maxVectorsVersion)) {
      throw new Error(`
        The pgvecto.rs extension version is ${version}, but Immich only supports version ${this.minVectorsVersion}${
          this.maxVectorsVersion !== VersionType.PATCH
            ? ` and later ${VersionType[this.maxVectorsVersion + 1].toLowerCase()} releases`
            : ''
        }.
        Please run 'DROP EXTENSION IF EXISTS vectors' and switch to ${this.maxVectorsVersion}${suggestion}.`);
    }

    if (!this.maxVectorsVersion && version.minor > this.minVectorsVersion.minor) {
      throw new Error(`
        The pgvecto.rs extension version is ${version}, but only 
        Please run 'DROP EXTENSION IF EXISTS vectors' and switch to ${this.minVectorsVersion}${suggestion}.`);
    }

    // if (version.isOlderThan(this.minVectorsVersion)) {
    //   throw new Error(`
    //     The pgvecto.rs extension version is ${version}, which is older than the minimum supported version ${this.minVectorsVersion}.
    //     Please upgrade to this version or later${suggestion}.`);
    // }
  }

  private async createVectors() {
    await this.databaseRepository.createExtension(DatabaseExtension.VECTORS).catch(async (error: QueryFailedError) => {
      const image = await this.getVectorsImage();
      this.logger.fatal(`
        Failed to create pgvecto.rs extension.
        If you have not updated your Postgres instance to a docker image that supports pgvecto.rs (such as '${image}'), please do so.
        See the v1.91.0 release notes for more info: https://github.com/immich-app/immich/releases/tag/v1.91.0'
      `);
      throw error;
    });
  }

  private async getVectorsImage() {
    const { major } = await this.databaseRepository.getPostgresVersion();
    if (![14, 15, 16].includes(major)) {
      return null;
    }
    return `tensorchord/pgvecto-rs:pg${major}-v${this.maxVectorsVersion}`;
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
