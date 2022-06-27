import { Controller, Post, Body, Patch, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { DeviceInfoService } from './device-info.service';
import { CreateDeviceInfoDto } from './dto/create-device-info.dto';
import { UpdateDeviceInfoDto } from './dto/update-device-info.dto';

@UseGuards(JwtAuthGuard)
@Controller('device-info')
export class DeviceInfoController {
  constructor(private readonly deviceInfoService: DeviceInfoService) {}

  @Post()
  async create(@Body(ValidationPipe) createDeviceInfoDto: CreateDeviceInfoDto, @GetAuthUser() authUser: AuthUserDto) {
    return await this.deviceInfoService.create(createDeviceInfoDto, authUser);
  }

  @Patch()
  async update(@Body(ValidationPipe) updateDeviceInfoDto: UpdateDeviceInfoDto, @GetAuthUser() authUser: AuthUserDto) {
    return this.deviceInfoService.update(authUser.id, updateDeviceInfoDto);
  }
}
