import { AlbumService, AuthUserDto } from '@app/domain';
import { GetAlbumsDto } from '@app/domain/album/dto/get-albums.dto';
import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('Album')
@Controller('album')
@Authenticated()
@UsePipes(new ValidationPipe({ transform: true }))
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Get()
  async getAllAlbums(@GetAuthUser() authUser: AuthUserDto, @Query() query: GetAlbumsDto) {
    return this.service.getAllAlbums(authUser, query);
  }
}
