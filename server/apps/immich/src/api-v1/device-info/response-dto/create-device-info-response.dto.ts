import { DeviceInfoEntity, DeviceType } from '@app/database/entities/device-info.entity';

export class DeviceInfoResponseDto {
  id!: number;
  userId!: string;
  deviceId!: string;
  deviceType!: DeviceType;
  notificationToken!: string | null;
  createdAt!: string;
  isAutoBackup!: boolean;
}

export function mapDeviceInfoResponse(entity: DeviceInfoEntity): DeviceInfoResponseDto {
  return {
    id: entity.id,
    userId: entity.userId,
    deviceId: entity.deviceId,
    deviceType: entity.deviceType,
    notificationToken: entity.notificationToken,
    createdAt: entity.createdAt,
    isAutoBackup: entity.isAutoBackup,
  };
}
