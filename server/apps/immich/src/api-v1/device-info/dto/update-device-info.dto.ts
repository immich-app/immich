import { DeviceType } from '@app/database/entities/device-info.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateDeviceInfoDto {
  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  @ApiProperty({ enumName: 'DeviceTypeEnum', enum: DeviceType })
  deviceType!: DeviceType;

  @IsOptional()
  isAutoBackup?: boolean;
}
