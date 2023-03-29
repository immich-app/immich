import { SystemConfigEntity } from '@app/infra/entities';

export const ISystemConfigRepository = 'ISystemConfigRepository';

export interface ISystemConfigRepository {
  load(): Promise<SystemConfigEntity[]>;
  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]>;
  deleteKeys(keys: string[]): Promise<void>;
}
