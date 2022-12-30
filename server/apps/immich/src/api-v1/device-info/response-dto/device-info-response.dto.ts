import { DeviceInfoEntity, DeviceType } from '@app/database';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceInfoResponseDto {
  @ApiProperty({ type: 'integer' })
  id!: number;
  userId!: string;
  deviceId!: string;

  @ApiProperty({ enumName: 'DeviceTypeEnum', enum: DeviceType })
  deviceType!: DeviceType;

  createdAt!: string;
  isAutoBackup!: boolean;
}

export function mapDeviceInfoResponse(entity: DeviceInfoEntity): DeviceInfoResponseDto {
  return {
    id: entity.id,
    userId: entity.userId,
    deviceId: entity.deviceId,
    deviceType: entity.deviceType,
    createdAt: entity.createdAt,
    isAutoBackup: entity.isAutoBackup,
  };
}
