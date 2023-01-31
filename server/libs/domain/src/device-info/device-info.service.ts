import { Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { DeviceInfoCore } from './device-info.core';
import { IDeviceInfoRepository } from './device-info.repository';
import { UpsertDeviceInfoDto } from './dto';
import { DeviceInfoResponseDto, mapDeviceInfoResponse } from './response-dto';

@Injectable()
export class DeviceInfoService {
  private core: DeviceInfoCore;

  constructor(@Inject(IDeviceInfoRepository) repository: IDeviceInfoRepository) {
    this.core = new DeviceInfoCore(repository);
  }

  public async upsert(authUser: AuthUserDto, dto: UpsertDeviceInfoDto): Promise<DeviceInfoResponseDto> {
    const deviceInfo = await this.core.upsert({ ...dto, userId: authUser.id });
    return mapDeviceInfoResponse(deviceInfo);
  }
}
