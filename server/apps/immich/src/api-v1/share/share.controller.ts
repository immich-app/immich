import { Controller, Get, Param, Delete, Patch, Body, ValidationPipe } from '@nestjs/common';
import { ShareService } from './share.service';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { SharedLinkResponseDto } from './response-dto/shared-link-response.dto';
import { EditSharedLinkDto } from './dto/edit-shared-link.dto';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}
  @Authenticated()
  @Get()
  getAllSharedLinks(@GetAuthUser() authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.shareService.findAll(authUser);
  }

  @Get(':key')
  getSharedLinkByKey(@Param('key') key: string): Promise<SharedLinkResponseDto> {
    return this.shareService.getSharedLinkByKey(key);
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
