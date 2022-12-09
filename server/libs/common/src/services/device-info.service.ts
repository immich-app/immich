import { Inject, Injectable } from '@nestjs/common';

export interface DeviceInfo {
  id: number;
  userId: string;
  deviceId: string;
  deviceType: DeviceType;
  notificationToken: string | null;
  createdAt: string;
  isAutoBackup: boolean;
}

export enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

type DeviceInfoKeys = Pick<DeviceInfo, 'deviceId' | 'userId'>;

export type DeviceInfoLookupDto = DeviceInfoKeys;
export type DeviceInfoUpsertDto = DeviceInfoKeys & Partial<DeviceInfo>;

export const IDeviceInfoRepository = 'DeviceInfoRepository';

export interface IDeviceInfoRepository {
  findByDeviceId(dto: DeviceInfoLookupDto): Promise<DeviceInfo | null>;
  save(dto: DeviceInfoUpsertDto): Promise<DeviceInfo>;
}

@Injectable()
export class DeviceInfoService {
  constructor(
    @Inject(IDeviceInfoRepository)
    private repository: IDeviceInfoRepository,
  ) {}

  public async upsert(dto: DeviceInfoUpsertDto): Promise<DeviceInfo> {
    const { deviceId, userId } = dto;
    const exists = await this.repository.findByDeviceId({ deviceId, userId });

    if (!exists) {
      return await this.repository.save(dto);
    }

    exists.isAutoBackup = dto.isAutoBackup ?? exists.isAutoBackup;
    exists.deviceType = dto.deviceType ?? exists.deviceType;

    return await this.repository.save(exists);
  }
}
