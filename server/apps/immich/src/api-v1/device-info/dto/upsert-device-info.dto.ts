import { DeviceType } from '@app/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertDeviceInfoDto {
  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  @ApiProperty({ enumName: 'DeviceTypeEnum', enum: DeviceType })
  deviceType!: DeviceType;

  @IsOptional()
  isAutoBackup?: boolean;
}
