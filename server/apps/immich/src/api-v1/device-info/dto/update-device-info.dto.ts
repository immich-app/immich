import { DeviceType } from '@app/database/entities/device-info.entity';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreateDeviceInfoDto } from './create-device-info.dto';

export class UpdateDeviceInfoDto {
  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  @ApiProperty({ enumName: 'DeviceTypeEnum', enum: DeviceType })
  deviceType!: DeviceType;

  @IsOptional()
  isAutoBackup?: boolean;
}
