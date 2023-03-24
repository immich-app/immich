import { AuthUserDto, EditSharedLinkDto, SharedLinkResponseDto, ShareService } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Patch, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('share')
@Controller('share')
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
  @Get(':id')
  getSharedLinkById(@GetAuthUser() authUser: AuthUserDto, @Param('id') id: string): Promise<SharedLinkResponseDto> {
    return this.service.getById(authUser, id, true);
  }

  @Authenticated()
  @Delete(':id')
  removeSharedLink(@GetAuthUser() authUser: AuthUserDto, @Param('id') id: string): Promise<void> {
    return this.service.remove(authUser, id);
  }

  @Authenticated()
  @Patch(':id')
  editSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: EditSharedLinkDto,
  ): Promise<SharedLinkResponseDto> {
    return this.service.edit(authUser, id, dto);
  }
}
