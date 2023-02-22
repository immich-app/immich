import { DeviceInfoEntity } from '@app/infra/db/entities';
import { IDeviceInfoRepository } from './device-info.repository';

type UpsertKeys = Pick<DeviceInfoEntity, 'deviceId' | 'userId'>;
type UpsertEntity = UpsertKeys & Partial<DeviceInfoEntity>;

export class DeviceInfoCore {
  constructor(private repository: IDeviceInfoRepository) {}

  async upsert(entity: UpsertEntity) {
    const exists = await this.repository.get(entity.userId, entity.deviceId);
    if (!exists) {
      if (!entity.isAutoBackup) {
        entity.isAutoBackup = false;
      }
      return this.repository.save(entity);
    }

    exists.isAutoBackup = entity.isAutoBackup ?? exists.isAutoBackup;
    exists.deviceType = entity.deviceType ?? exists.deviceType;
    return this.repository.save(exists);
  }
}
