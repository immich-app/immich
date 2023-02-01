import { IDeviceInfoRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceInfoEntity } from '../entities';

export class DeviceInfoRepository implements IDeviceInfoRepository {
  constructor(@InjectRepository(DeviceInfoEntity) private repository: Repository<DeviceInfoEntity>) {}

  get(userId: string, deviceId: string): Promise<DeviceInfoEntity | null> {
    return this.repository.findOne({ where: { userId, deviceId } });
  }

  save(entity: Partial<DeviceInfoEntity>): Promise<DeviceInfoEntity> {
    return this.repository.save(entity);
  }
}
