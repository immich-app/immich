import { SystemConfigEntity } from '@app/infra/entities';

export const ISystemConfigRepository = 'ISystemConfigRepository';

export interface ISystemConfigRepository {
  load(): Promise<SystemConfigEntity[]>;
  readFile(filename: string): Promise<Buffer>;
  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]>;
  deleteKeys(keys: string[]): Promise<void>;
}
