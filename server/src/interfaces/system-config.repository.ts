import { SystemConfigEntity } from 'src/infra/entities/system-config.entity';

export const ISystemConfigRepository = 'ISystemConfigRepository';

export interface ISystemConfigRepository {
  fetchStyle(url: string): Promise<any>;
  load(): Promise<SystemConfigEntity[]>;
  readFile(filename: string): Promise<string>;
  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]>;
  deleteKeys(keys: string[]): Promise<void>;
}
