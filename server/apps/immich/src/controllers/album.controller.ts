/*  */ import { AlbumService, AuthUserDto, CreateAlbumDto, UpdateAlbumDto } from '@app/domain';
import { GetAlbumsDto } from '@app/domain/album/dto/get-albums.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Album')
@Controller('album')
@Authenticated()
@UseValidation()
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Get()
  getAllAlbums(@GetAuthUser() authUser: AuthUserDto, @Query() query: GetAlbumsDto) {
    return this.service.getAll(authUser, query);
  }

  @Post()
  createAlbum(@GetAuthUser() authUser: AuthUserDto, @Body() dto: CreateAlbumDto) {
    return this.service.create(authUser, dto);
  }

  @Patch(':id')
  updateAlbumInfo(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateAlbumDto) {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteAlbum(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(authUser, id);
  }
}
