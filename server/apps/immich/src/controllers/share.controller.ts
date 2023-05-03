import { AuthUserDto, EditSharedLinkDto, SharedLinkResponseDto, ShareService } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';
import { PartnerResponseDto } from '@app/domain';

@ApiTags('share')
@Controller('share')
@UseValidation()
export class ShareController {
  constructor(private readonly service: ShareService) {}

  @Authenticated()
  @Get()
  getAllSharedLinks(@GetAuthUser() authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Authenticated({ isShared: true })
  @Get('me')
  getMySharedLink(@GetAuthUser() authUser: AuthUserDto): Promise<SharedLinkResponseDto> {
    return this.service.getMine(authUser);
  }

  @Authenticated()
  @Get('partner')
  getPartners(@GetAuthUser() authUser: AuthUserDto): Promise<PartnerResponseDto[]> {
    return this.service.getAllPartners(authUser);
  }

  @Authenticated()
  @Get(':id')
  getSharedLinkById(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<SharedLinkResponseDto> {
    return this.service.getById(authUser, id, true);
  }

  @Authenticated()
  @Delete(':id')
  removeSharedLink(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(authUser, id);
  }

  @Authenticated()
  @Patch(':id')
  editSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: EditSharedLinkDto,
  ): Promise<SharedLinkResponseDto> {
    return this.service.edit(authUser, id, dto);
  }
}
