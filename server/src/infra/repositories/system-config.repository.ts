import { ISystemConfigRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { In, Repository } from 'typeorm';
import { SystemConfigEntity } from '../entities';

export type GithubRelease = {
  tag_name: string;
};

export class SystemConfigRepository implements ISystemConfigRepository {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private repository: Repository<SystemConfigEntity>,
  ) {}

  load(): Promise<SystemConfigEntity[]> {
    return this.repository.find();
  }

  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]> {
    return this.repository.save(items);
  }

  async getLatestAvailableVersion(): Promise<GithubRelease> {
    const { data } = await axios.get<GithubRelease>('https://api.github.com/repos/immich-app/immich/releases/latest');
    return data;
  }

  async deleteKeys(keys: string[]): Promise<void> {
    await this.repository.delete({ key: In(keys) });
  }
}
