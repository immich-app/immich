import { Controller, Get, Param, Delete } from '@nestjs/common';
import { ShareService } from './share.service';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { SharedLinkResponseDto } from './response-dto/shared-link-response.dto';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}
  @Authenticated()
  @Get()
  getAllSharedLinks(@GetAuthUser() authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.shareService.findAll(authUser);
  }

  @Get(':id')
  getSharedLinkByKey(@Param('id') id: string): Promise<SharedLinkResponseDto> {
    return this.shareService.getSharedLinkByKey(id);
  }

  @Authenticated()
  @Delete(':id')
  removeSharedLink(@Param('id') id: string, @GetAuthUser() authUser: AuthUserDto): Promise<string> {
    return this.shareService.remove(id, authUser.id);
  }
}
