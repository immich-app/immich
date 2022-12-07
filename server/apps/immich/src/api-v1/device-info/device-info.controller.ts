import { Body, Controller, Patch, Post, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { DeviceInfoService } from './device-info.service';
import { UpsertDeviceInfoDto } from './dto/upsert-device-info.dto';
import { mapDeviceInfoResponse } from './response-dto/device-info-response.dto';

@Authenticated()
@ApiBearerAuth()
@ApiTags('Device Info')
@Controller('device-info')
export class DeviceInfoController {
  constructor(private readonly deviceInfoService: DeviceInfoService) {}

  /** @deprecated */
  @Post()
  public async createDeviceInfo(@GetAuthUser() user: AuthUserDto, @Body(ValidationPipe) dto: UpsertDeviceInfoDto) {
    const deviceInfo = await this.deviceInfoService.upsert({ ...dto, userId: user.id });
    return mapDeviceInfoResponse(deviceInfo);
  }

  /** @deprecated */
  @Patch()
  public async updateDeviceInfo(@GetAuthUser() user: AuthUserDto, @Body(ValidationPipe) dto: UpsertDeviceInfoDto) {
    const deviceInfo = await this.deviceInfoService.upsert({ ...dto, userId: user.id });
    return mapDeviceInfoResponse(deviceInfo);
  }

  @Put()
  public async upsertDeviceInfo(@GetAuthUser() user: AuthUserDto, @Body(ValidationPipe) dto: UpsertDeviceInfoDto) {
    const deviceInfo = await this.deviceInfoService.upsert({ ...dto, userId: user.id });
    return mapDeviceInfoResponse(deviceInfo);
  }
}
