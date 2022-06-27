import { PartialType } from '@nestjs/mapped-types';
import { CreateDeviceInfoDto } from './create-device-info.dto';

export class UpdateDeviceInfoDto extends PartialType(CreateDeviceInfoDto) {}
