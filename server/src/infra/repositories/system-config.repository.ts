import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import { ISystemConfigRepository } from 'src/domain/repositories/system-config.repository';
import { SystemConfigEntity } from 'src/infra/entities/system-config.entity';
import { DummyValue, GenerateSql } from 'src/infra/infra.util';
import { Chunked } from 'src/infra/infra.utils';
import { Instrumentation } from 'src/infra/instrumentation';
import { In, Repository } from 'typeorm';

@Instrumentation()
export class SystemConfigRepository implements ISystemConfigRepository {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private repository: Repository<SystemConfigEntity>,
  ) {}

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

  @GenerateSql()
  load(): Promise<SystemConfigEntity[]> {
    return this.repository.find();
  }

  readFile(filename: string): Promise<string> {
    return readFile(filename, { encoding: 'utf8' });
  }

  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]> {
    return this.repository.save(items);
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  @Chunked()
  async deleteKeys(keys: string[]): Promise<void> {
    await this.repository.delete({ key: In(keys) });
  }
}
