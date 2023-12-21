import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Version } from '../domain.constant';
import { DatabaseExtension, IDatabaseRepository } from '../repositories';

@Injectable()
export class DatabaseService {
  private logger = new ImmichLogger(DatabaseService.name);
  minVectorsVersion = new Version(0, 1, 1);
  maxVectorsVersion = new Version(0, 1, 11);

  constructor(@Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository) {}

  async init() {
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

    if (version.isEqual(new Version(0, 0, 0))) {
      throw new Error(
        `The pgvecto.rs extension version is ${version}, which means it is a nightly release.` +
          `Please run 'DROP EXTENSION IF EXISTS vectors' and switch to a release version${suggestion}.`,
      );
    }

    if (version.isNewerThan(this.maxVectorsVersion)) {
      throw new Error(`
        The pgvecto.rs extension version is ${version} instead of ${this.maxVectorsVersion}.
        Please run 'DROP EXTENSION IF EXISTS vectors' and switch to ${this.maxVectorsVersion}${suggestion}.`);
    }

    if (version.isOlderThan(this.minVectorsVersion)) {
      throw new Error(`
        The pgvecto.rs extension version is ${version}, which is older than the minimum supported version ${this.minVectorsVersion}.
        Please upgrade to this version or later${suggestion}.`);
    }
  }

  private async createVectors() {
    await this.databaseRepository.createExtension(DatabaseExtension.VECTORS).catch(async (err: QueryFailedError) => {
      const image = await this.getVectorsImage();
      this.logger.fatal(`
        Failed to create pgvecto.rs extension.
        If you have not updated your Postgres instance to a docker image that supports pgvecto.rs (such as '${image}'), please do so.
        See the v1.91.0 release notes for more info: https://github.com/immich-app/immich/releases/tag/v1.91.0'
      `);
      throw err;
    });
  }

  private async getVectorsImage() {
    const { major } = await this.databaseRepository.getPostgresVersion();
    if (![14, 15, 16].includes(major)) {
      return null;
    }
    return `tensorchord/pgvecto-rs:pg${major}-v${this.maxVectorsVersion}`;
  }
}
