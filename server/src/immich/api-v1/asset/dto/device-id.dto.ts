import { IsNotEmpty, IsString } from 'class-validator';

export class DeviceIdDto {
  @IsNotEmpty()
  @IsString()
  deviceId!: string;
}
