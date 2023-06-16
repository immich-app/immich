import {
  AddUsersDto,
  AlbumCountResponseDto,
  AlbumService,
  AuthUserDto,
  CreateAlbumDto,
  UpdateAlbumDto,
} from '@app/domain';
import { GetAlbumsDto } from '@app/domain/album/dto/get-albums.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseMeUUIDPipe } from '../api-v1/validation/parse-me-uuid-pipe';
import { AuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Album')
@Controller('album')
@Authenticated()
@UseValidation()
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Get('count')
  getAlbumCount(@AuthUser() authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    return this.service.getCount(authUser);
  }

  @Get()
  getAllAlbums(@AuthUser() authUser: AuthUserDto, @Query() query: GetAlbumsDto) {
    return this.service.getAll(authUser, query);
  }

  @Post()
  createAlbum(@AuthUser() authUser: AuthUserDto, @Body() dto: CreateAlbumDto) {
    return this.service.create(authUser, dto);
  }

  @Patch(':id')
  updateAlbumInfo(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateAlbumDto) {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteAlbum(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(authUser, id);
  }

  @Put(':id/users')
  addUsersToAlbum(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: AddUsersDto) {
    return this.service.addUsers(authUser, id, dto);
  }

  @Delete(':id/user/:userId')
  removeUserFromAlbum(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.service.removeUser(authUser, id, userId);
  }
}
