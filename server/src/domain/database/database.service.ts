import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseExtension, IDatabaseRepository } from '../repositories';

@Injectable()
export class DatabaseService {
  private logger = new ImmichLogger(DatabaseService.name);
  private readonly expectedVectorsVersions: string[] = ['0.1.1', '0.1.11'];

  constructor(@Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository) {}

  async init() {
    await this.assertVectors();
    await this.databaseRepository.enablePrefilter();
    await this.databaseRepository.runMigrations();
  }

  async assertVectors() {
    await this.createVectors();

    const version = await this.databaseRepository.getExtensionVersion(DatabaseExtension.VECTORS);
    const image = await this.getVectorsImage();
    if (version != null && !this.expectedVectorsVersions.includes(version)) {
      throw new Error(
        `The pgvecto.rs extension version is ${version} instead of ${this.preferredVectorsVersion}.` +
          `If you're using the 'latest' tag, please switch to '${image}'.`,
      );
    }
  }

  async createVectors() {
    const image = await this.getVectorsImage();
    await this.databaseRepository.createExtension(DatabaseExtension.VECTORS).catch((err) => {
      this.logger.error(
        'Failed to create pgvecto.rs extension. ' +
          `If you have not updated your Postgres instance to an image that supports pgvecto.rs (such as '${image}'), please do so. ` +
          'See the v1.91.0 release notes for more info: https://github.com/immich-app/immich/releases/tag/v1.91.0',
      );
      throw err;
    });
  }

  async getVectorsImage() {
    const postgresVersion = await this.databaseRepository.getPostgresVersion();
    return `tensorchord/pgvecto-rs:pg${postgresVersion}-v${this.preferredVectorsVersion}`;
  }

  private get preferredVectorsVersion() {
    return this.expectedVectorsVersions[this.expectedVectorsVersions.length - 1];
  }
}
