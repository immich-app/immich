import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { DeviceType } from '../entities/device-info.entity';
import { CreateDeviceInfoDto } from './create-device-info.dto';

export class UpdateDeviceInfoDto extends PartialType(CreateDeviceInfoDto) {}
