import { Body, Controller, Delete, Get, Param, Patch, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { EditSharedLinkDto } from './dto/edit-shared-link.dto';
import { SharedLinkResponseDto } from './response-dto/shared-link-response.dto';
import { ShareService } from './share.service';

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
    return this.shareService.getById(id);
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
