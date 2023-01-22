import { Body, Controller, Delete, Get, Param, Patch, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { AuthUserDto, EditSharedLinkDto, SharedLinkResponseDto, ShareService } from '@app/domain';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}
  @Authenticated()
  @Get()
  getAllSharedLinks(@GetAuthUser() authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.shareService.getAll(authUser);
  }

  @Authenticated({ isShared: true })
  @Get('me')
  getMySharedLink(@GetAuthUser() authUser: AuthUserDto): Promise<SharedLinkResponseDto> {
    return this.shareService.getMine(authUser);
  }

  @Authenticated()
  @Get(':id')
  getSharedLinkById(@Param('id') id: string): Promise<SharedLinkResponseDto> {
    return this.shareService.getById(id, true);
  }

  @Authenticated()
  @Delete(':id')
  removeSharedLink(@Param('id') id: string, @GetAuthUser() authUser: AuthUserDto): Promise<string> {
    return this.shareService.remove(id, authUser.id);
  }

  @Authenticated()
  @Patch(':id')
  editSharedLink(
    @Param('id') id: string,
    @GetAuthUser() authUser: AuthUserDto,
    @Body(new ValidationPipe()) dto: EditSharedLinkDto,
  ): Promise<SharedLinkResponseDto> {
    return this.shareService.edit(id, authUser, dto);
  }
}
