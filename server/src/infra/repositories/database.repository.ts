import { DatabaseExtension, IDatabaseRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseRepository implements IDatabaseRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async enablePrefilter(): Promise<void> {
    await this.dataSource.query(`SET vectors.enable_prefilter = on`);
  }

  async getExtensionVersion(extension: DatabaseExtension): Promise<string | null> {
    const res = await this.dataSource.query(`SELECT extversion FROM pg_extension WHERE extname = $1`, [extension]);
    return res[0]?.['extversion'] ?? null;
  }

  async getPostgresVersion(): Promise<string> {
    const res = await this.dataSource.query(`SHOW server_version`);
    return res[0]['server_version'].split('.')[0];
  }

  async createExtension(extension: DatabaseExtension): Promise<void> {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS ${extension}`);
  }

  async runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void> {
    await this.dataSource.runMigrations(options);
  }
}
