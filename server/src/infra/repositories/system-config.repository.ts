import { ISystemConfigRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { readFile } from 'fs/promises';
import { In, Repository } from 'typeorm';
import { SystemConfigEntity } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';

export class SystemConfigRepository implements ISystemConfigRepository {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private repository: Repository<SystemConfigEntity>,
  ) {}
  async fetchStyle(url: string) {
    return axios.get(url).then((response) => response.data);
  }

  @GenerateSql()
  load(): Promise<SystemConfigEntity[]> {
    return this.repository.find();
  }

  readFile(filename: string): Promise<string> {
    return readFile(filename, { encoding: 'utf-8' });
  }

  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]> {
    return this.repository.save(items);
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  async deleteKeys(keys: string[]): Promise<void> {
    await this.repository.delete({ key: In(keys) });
  }
}
