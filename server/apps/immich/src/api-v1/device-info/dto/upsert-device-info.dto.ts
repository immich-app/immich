import { IsNotEmpty, IsOptional } from 'class-validator';
import { DeviceType } from '@app/database';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertDeviceInfoDto {
  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  @ApiProperty({ enumName: 'DeviceTypeEnum', enum: DeviceType })
  deviceType!: DeviceType;

  @IsOptional()
  isAutoBackup?: boolean;
}
