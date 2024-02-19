import { ISystemConfigRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import { In, Repository } from 'typeorm';
import { SystemConfigEntity } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';
import { Chunked } from '../infra.utils';
import { Span } from 'nestjs-otel';

export class SystemConfigRepository implements ISystemConfigRepository {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private repository: Repository<SystemConfigEntity>,
  ) {}

  @Span()
  async fetchStyle(url: string) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url} with status ${response.status}: ${await response.text()}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch data from ${url}: ${error}`);
    }
  }

  @Span()
  @GenerateSql()
  load(): Promise<SystemConfigEntity[]> {
    return this.repository.find();
  }

  @Span()
  readFile(filename: string): Promise<string> {
    return readFile(filename, { encoding: 'utf8' });
  }

  @Span()
  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]> {
    return this.repository.save(items);
  }

  @Span()
  @GenerateSql({ params: [DummyValue.STRING] })
  @Chunked()
  async deleteKeys(keys: string[]): Promise<void> {
    await this.repository.delete({ key: In(keys) });
  }
}
