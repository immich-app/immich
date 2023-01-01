import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { ShareService } from './share.service';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateSharedLinkDto } from './dto/create-shared-link.dto';
import { SharedLinkResponseDto } from './response-dto/shared-link-response.dto';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Authenticated()
  @Post()
  create(
    @Body(ValidationPipe) createSharedLinkDto: CreateSharedLinkDto,
    @GetAuthUser() authUser: AuthUserDto,
  ): Promise<SharedLinkResponseDto> {
    return this.shareService.createSharedLink(authUser, createSharedLinkDto);
  }

  @Get()
  @Authenticated()
  findAll(@GetAuthUser() authUser: AuthUserDto) {
    return this.shareService.findAll(authUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shareService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shareService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShareDto: any) {
    return 'ok';
  }
}
