import { DeviceType } from '@app/database/entities/device-info.entity';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreateDeviceInfoDto } from './create-device-info.dto';

export class UpdateDeviceInfoDto {
  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  deviceType!: DeviceType;

  @IsOptional()
  isAutoBackup?: boolean;
}
