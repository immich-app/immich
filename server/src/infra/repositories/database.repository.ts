import { DatabaseExtension, DatabaseLock, IDatabaseRepository, Version } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import AsyncLock from 'async-lock';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseRepository implements IDatabaseRepository {
  readonly asyncLock = new AsyncLock();

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getExtensionVersion(extension: DatabaseExtension): Promise<Version | null> {
    const res = await this.dataSource.query(`SELECT extversion FROM pg_extension WHERE extname = $1`, [extension]);
    const version = res[0]?.['extversion'];
    return version == null ? null : Version.fromString(version);
  }

  async getPostgresVersion(): Promise<Version> {
    const res = await this.dataSource.query(`SHOW server_version`);
    return Version.fromString(res[0]['server_version']);
  }

  async createExtension(extension: DatabaseExtension): Promise<void> {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS ${extension}`);
  }

  async runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void> {
    await this.dataSource.runMigrations(options);
  }

  async withLock<R>(lock: DatabaseLock, callback: () => Promise<R>): Promise<R> {
    let res;
    await this.asyncLock.acquire(DatabaseLock[lock], async () => {
      try {
        await this.acquireLock(lock);
        res = await callback();
      } finally {
        await this.releaseLock(lock);
      }
    });

    return res as R;
  }

  isBusy(lock: DatabaseLock): boolean {
    return this.asyncLock.isBusy(DatabaseLock[lock]);
  }

  async wait(lock: DatabaseLock): Promise<void> {
    await this.asyncLock.acquire(DatabaseLock[lock], () => {});
  }

  private async acquireLock(lock: DatabaseLock): Promise<void> {
    return this.dataSource.query('SELECT pg_advisory_lock($1)', [lock]);
  }

  private async releaseLock(lock: DatabaseLock): Promise<void> {
    return this.dataSource.query('SELECT pg_advisory_unlock($1)', [lock]);
  }
}
