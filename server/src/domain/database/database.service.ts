import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Version, VersionType } from '../domain.constant';
import { DatabaseExtension, IDatabaseRepository, extName } from '../repositories';

@Injectable()
export class DatabaseService {
  private logger = new ImmichLogger(DatabaseService.name);
  private vectorExt: DatabaseExtension;
  minPostgresVersion = 14;
  minVectorsVersion = new Version(0, 0, 0);
  vectorsVersionPin = VersionType.MINOR;
  minVectorVersion = new Version(0, 5, 0);
  vectorVersionPin = VersionType.MAJOR;

  constructor(@Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository) {
    this.vectorExt = this.databaseRepository.getPreferredVectorExtension();
  }

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
    await this.databaseRepository.createExtension(this.vectorExt).catch(async (err: QueryFailedError) => {
      const otherExt =
        this.vectorExt === DatabaseExtension.VECTORS ? DatabaseExtension.VECTOR : DatabaseExtension.VECTORS;
      this.logger.fatal(`
        Failed to activate the ${extName[this.vectorExt]} extension.
        Please ensure the Postgres instance has ${extName[this.vectorExt]} installed.
        If the Postgres instance already has ${extName[this.vectorExt]} installed, Immich may not have the necessary permissions to activate it.
        In this case, please run 'CREATE EXTENSION IF NOT EXISTS ${this.vectorExt}' manually as a superuser.

        Alternatively, if your Postgres instance has ${extName[otherExt]}, you may use this instead by setting the environment variable 'IMMICH_VECTOR_EXTENSION=${otherExt}'.
        Note that switching between the two extensions after a successful startup is not supported.
        The exception is if your version of Immich prior to upgrading was 1.90.2 or earlier.
        In this case, you may set either extension now, but you will not be able to switch to the other extension following a successful startup.
      `);
      throw err;
    });
  }

  private async updateVectorExtension() {
    const [version, availableVersion] = await Promise.all([
      this.databaseRepository.getExtensionVersion(this.vectorExt),
      this.databaseRepository.getAvailableExtensionVersion(this.vectorExt),
    ]);
    if (version == null) {
      throw new Error(`Unexpected: The ${extName[this.vectorExt]} extension is not installed.`);
    }

    if (availableVersion == null) {
      return;
    }

    const maxVersion = this.vectorExt === DatabaseExtension.VECTOR ? this.vectorVersionPin : this.vectorsVersionPin;
    const isNewer = availableVersion.isNewerThan(version);
    if (isNewer != null && isNewer < maxVersion) {
      try {
        await this.databaseRepository.updateExtension(this.vectorExt, availableVersion);
      } catch (err) {
        this.logger.warn(`
          The ${extName[this.vectorExt]} extension version is ${version}, but ${availableVersion} is available.
          Immich attempted to update the extension, but failed to do so.
          This may be because Immich does not have the necessary permissions to update the extension.
          Please run 'ALTER EXTENSION ${this.vectorExt} UPDATE' manually as a superuser.`);
      }
    }
  }

  private async assertVectorExtension() {
    const version = await this.databaseRepository.getExtensionVersion(this.vectorExt);
    if (version == null) {
      throw new Error(`Unexpected: The ${extName[this.vectorExt]} extension is not installed.`);
    }

    if (version.isEqual(new Version(0, 0, 0))) {
      this.logger.fatal(`
        The ${extName[this.vectorExt]} extension version is ${version}, which means it is a nightly release.
        Please run 'DROP EXTENSION IF EXISTS ${this.vectorExt}' and switch to a release version.`);
      throw new Error();
    }

    const minVersion = this.vectorExt === DatabaseExtension.VECTOR ? this.minVectorVersion : this.minVectorsVersion;
    const maxVersion = this.vectorExt === DatabaseExtension.VECTOR ? this.vectorVersionPin : this.vectorsVersionPin;

    if (version.isOlderThan(minVersion) || (version.isNewerThan(minVersion) ?? 0) >= maxVersion) {
      const releases =
        maxVersion !== VersionType.PATCH
          ? `${minVersion} and later ${VersionType[maxVersion - 1].toLowerCase()} releases`
          : minVersion.toString();

      this.logger.fatal(`
        The ${extName[this.vectorExt]} extension version is ${version}, but Immich only supports ${releases}.
        If the Postgres instance already has a compatible version installed, Immich may not have the necessary permissions to activate it.
        In this case, please run 'ALTER EXTENSION UPDATE ${this.vectorExt}' manually as a superuser.
        Otherwise, please update the version of ${extName[this.vectorExt]} in the Postgres instance to a compatible version.`);
      throw new Error();
    }
  }
}
