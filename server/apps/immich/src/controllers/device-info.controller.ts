import {
  AuthUserDto,
  DeviceInfoResponseDto as ResponseDto,
  DeviceInfoService,
  UpsertDeviceInfoDto as UpsertDto,
} from '@app/domain';
import { Body, Controller, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@Authenticated()
@ApiBearerAuth()
@ApiTags('Device Info')
@Controller('device-info')
export class DeviceInfoController {
  constructor(private readonly service: DeviceInfoService) {}

  @Put()
  upsertDeviceInfo(@GetAuthUser() authUser: AuthUserDto, @Body(ValidationPipe) dto: UpsertDto): Promise<ResponseDto> {
    return this.service.upsert(authUser, dto);
  }
}
