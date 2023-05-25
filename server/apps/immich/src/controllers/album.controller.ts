import { AlbumService, AuthUserDto, CreateAlbumDto } from '@app/domain';
import { GetAlbumsDto } from '@app/domain/album/dto/get-albums.dto';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

@ApiTags('Album')
@Controller('album')
@Authenticated()
@UseValidation()
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Get()
  async getAllAlbums(@GetAuthUser() authUser: AuthUserDto, @Query() query: GetAlbumsDto) {
    return this.service.getAll(authUser, query);
  }

  @Post()
  createAlbum(@GetAuthUser() authUser: AuthUserDto, @Body() dto: CreateAlbumDto) {
    return this.service.create(authUser, dto);
  }
}
