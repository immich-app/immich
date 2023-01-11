import { DeviceInfoEntity } from '@app/infra';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

type EntityKeys = Pick<DeviceInfoEntity, 'deviceId' | 'userId'>;
type Entity = EntityKeys & Partial<DeviceInfoEntity>;

@Injectable()
export class DeviceInfoService {
  constructor(
    @InjectRepository(DeviceInfoEntity)
    private repository: Repository<DeviceInfoEntity>,
  ) {}

  public async upsert(entity: Entity): Promise<DeviceInfoEntity> {
    const { deviceId, userId } = entity;
    const exists = await this.repository.findOne({ where: { userId, deviceId } });

    if (!exists) {
      if (!entity.isAutoBackup) {
        entity.isAutoBackup = false;
      }
      return await this.repository.save(entity);
    }

    exists.isAutoBackup = entity.isAutoBackup ?? exists.isAutoBackup;
    exists.deviceType = entity.deviceType ?? exists.deviceType;
    return await this.repository.save(exists);
  }
}
