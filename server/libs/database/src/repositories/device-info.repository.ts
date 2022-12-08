import { DeviceInfo, DeviceInfoLookupDto, DeviceInfoUpsertDto, IDeviceInfoRepository } from '@app/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceInfoEntity } from '../entities/device-info.entity';

export class DeviceInfoRepository implements IDeviceInfoRepository {
  constructor(@InjectRepository(DeviceInfoEntity) private repository: Repository<DeviceInfoEntity>) {}

  public async findByDeviceId(dto: DeviceInfoLookupDto): Promise<DeviceInfo | null> {
    const { deviceId, userId } = dto;
    return await this.repository.findOne({ where: { deviceId, userId } });
  }

  public async save(dto: DeviceInfoUpsertDto): Promise<DeviceInfo> {
    return await this.repository.save(dto);
  }
}
