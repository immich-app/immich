import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { ShareService } from './share.service';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateSharedLinkDto } from './dto/create-shared-link.dto';
import { SharedLinkResponseDto } from './response-dto/shared-link-response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Authenticated()
  @Post()
  createSharedLink(
    @Body(ValidationPipe) createSharedLinkDto: CreateSharedLinkDto,
    @GetAuthUser() authUser: AuthUserDto,
  ): Promise<SharedLinkResponseDto> {
    return this.shareService.createSharedLink(authUser, createSharedLinkDto);
  }

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
