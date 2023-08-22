import { SystemConfig, SystemConfigEntity } from '@app/infra/entities';
import { DeepPartial } from 'typeorm/common/DeepPartial.js';

export const ISystemConfigRepository = 'ISystemConfigRepository';

export interface ISystemConfigRepository {
  load(): Promise<SystemConfigEntity[]>;
  readConfigFile(): Promise<DeepPartial<SystemConfig>>;
  saveAll(items: SystemConfigEntity[]): Promise<SystemConfigEntity[]>;
  deleteKeys(keys: string[]): Promise<void>;
}
