import { IsNotEmpty, IsOptional } from 'class-validator';
import { DeviceType } from '@app/database/entities/device-info.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceInfoDto {
  @IsNotEmpty()
  deviceId!: string;

  @IsNotEmpty()
  @ApiProperty({ enumName: 'DeviceTypeEnum', enum: DeviceType })
  deviceType!: DeviceType;

  @IsOptional()
  isAutoBackup?: boolean;
}
