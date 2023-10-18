import { SystemConfigEntity } from '@app/infra/entities';
import { GithubRelease } from '@app/infra/repositories';

export const ISystemConfigRepository = 'ISystemConfigRepository';

export interface ISystemConfigRepository {
  load(): Promise<SystemConfigEntity[]>;
  readFile(filename: string): Promise<Buffer>;
  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]>;
  deleteKeys(keys: string[]): Promise<void>;
  getLatestAvailableVersion(): Promise<GithubRelease>;
}
