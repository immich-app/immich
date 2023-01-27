import { Body, Controller, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { DeviceInfoService } from './device-info.service';
import { UpsertDeviceInfoDto } from './dto/upsert-device-info.dto';
import { DeviceInfoResponseDto, mapDeviceInfoResponse } from './response-dto/device-info-response.dto';

@Authenticated()
@ApiBearerAuth()
@ApiTags('Device Info')
@Controller('device-info')
export class DeviceInfoController {
  constructor(private readonly deviceInfoService: DeviceInfoService) {}

  @Put()
  public async upsertDeviceInfo(
    @GetAuthUser() user: AuthUserDto,
    @Body(ValidationPipe) dto: UpsertDeviceInfoDto,
  ): Promise<DeviceInfoResponseDto> {
    const deviceInfo = await this.deviceInfoService.upsert({ ...dto, userId: user.id });
    return mapDeviceInfoResponse(deviceInfo);
  }
}
