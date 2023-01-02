import { Controller, Get, Param, Delete } from '@nestjs/common';
import { ShareService } from './share.service';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}
  @Authenticated()
  @Get()
  getAllSharedLinks(@GetAuthUser() authUser: AuthUserDto) {
    return this.shareService.findAll(authUser);
  }

  @Get(':id')
  getSharedLink(@Param('id') id: string) {
    return this.shareService.findOne(id);
  }

  @Delete(':id')
  removeSharedLink(@Param('id') id: string) {
    return this.shareService.remove(id);
  }
}
