import { DeviceInfoEntity } from '@app/infra/db/entities';

export const IDeviceInfoRepository = 'IDeviceInfoRepository';

export interface IDeviceInfoRepository {
  get(userId: string, deviceId: string): Promise<DeviceInfoEntity | null>;
  save(entity: Partial<DeviceInfoEntity>): Promise<DeviceInfoEntity>;
}
