import {
  AddUsersDto,
  AlbumCountResponseDto,
  AlbumInfoDto,
  AlbumResponseDto,
  AlbumService,
  AuthUserDto,
  BulkIdResponseDto,
  BulkIdsDto,
  CreateAlbumDto as CreateDto,
  GetAlbumsDto,
  UpdateAlbumDto as UpdateDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseMeUUIDPipe } from '../api-v1/validation/parse-me-uuid-pipe';
import { Authenticated, AuthUser, SharedLinkRoute } from '../app.guard';
import { UseValidation } from '../app.utils';
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
  createAlbum(@AuthUser() authUser: AuthUserDto, @Body() dto: CreateDto) {
    return this.service.create(authUser, dto);
  }

  @SharedLinkRoute()
  @Get(':id')
  getAlbumInfo(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Query() dto: AlbumInfoDto) {
    return this.service.get(authUser, id, dto);
  }

  @Patch(':id')
  updateAlbumInfo(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateDto) {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteAlbum(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(authUser, id);
  }

  @SharedLinkRoute()
  @Put(':id/assets')
  addAssetsToAlbum(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(authUser, id, dto);
  }

  @Delete(':id/assets')
  removeAssetFromAlbum(
    @AuthUser() authUser: AuthUserDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(authUser, id, dto);
  }

  @Put(':id/users')
  addUsersToAlbum(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AddUsersDto,
  ): Promise<AlbumResponseDto> {
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
