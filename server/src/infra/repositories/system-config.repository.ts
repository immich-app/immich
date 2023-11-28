import { ISystemConfigRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { readFile } from 'fs/promises';
import { In, Repository } from 'typeorm';
import { SystemConfigEntity } from '../entities';

export class SystemConfigRepository implements ISystemConfigRepository {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private repository: Repository<SystemConfigEntity>,
  ) {}
  async fetchStyle(url: string) {
    return axios.get(url).then((response) => response.data);
  }

  load(): Promise<SystemConfigEntity[]> {
    return this.repository.find();
  }

  readFile(filename: string): Promise<string> {
    return readFile(filename, { encoding: 'utf-8' });
  }

  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]> {
    return this.repository.save(items);
  }

  async deleteKeys(keys: string[]): Promise<void> {
    await this.repository.delete({ key: In(keys) });
  }
}
