import { IsNotEmpty, IsOptional } from 'class-validator';
import { DeviceType } from '../entities/device-info.entity';

export class CreateDeviceInfoDto {
  @IsNotEmpty()
  deviceId: string;

  @IsNotEmpty()
  deviceType: DeviceType;

  @IsOptional()
  isAutoBackup: boolean;
}
