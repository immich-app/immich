import {
  AuthUserDto,
  DeviceInfoResponseDto as ResponseDto,
  DeviceInfoService,
  UpsertDeviceInfoDto as UpsertDto,
} from '@app/domain';
import { Body, Controller, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('Device Info')
@Controller('device-info')
@Authenticated()
@UsePipes(new ValidationPipe({ transform: true }))
export class DeviceInfoController {
  constructor(private readonly service: DeviceInfoService) {}

  @Put()
  upsertDeviceInfo(@GetAuthUser() authUser: AuthUserDto, @Body() dto: UpsertDto): Promise<ResponseDto> {
    return this.service.upsert(authUser, dto);
  }
}
