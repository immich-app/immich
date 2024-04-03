import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AddUsersDto,
  AlbumCountResponseDto,
  AlbumInfoDto,
  AlbumResponseDto,
  CreateAlbumDto,
  CreateSubAlbumDto,
  GetAlbumsDto,
  UpdateAlbumDto,
} from 'src/dtos/album.dto';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated, SharedLinkRoute } from 'src/middleware/auth.guard';
import { AlbumService } from 'src/services/album.service';
import { ParseMeUUIDPipe, UUIDParamDto } from 'src/validation';

@ApiTags('Album')
@Controller('album')
@Authenticated()
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Get('count')
  getAlbumCount(@Auth() auth: AuthDto): Promise<AlbumCountResponseDto> {
    return this.service.getCount(auth);
  }

  @Get()
  getAllAlbums(@Auth() auth: AuthDto, @Query() query: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    return this.service.getAll(auth, query);
  }

  @Post()
  createAlbum(@Auth() auth: AuthDto, @Body() dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    return this.service.create(auth, dto);
  }

  @SharedLinkRoute()
  @Get(':id')
  getAlbumInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: AlbumInfoDto,
  ): Promise<AlbumResponseDto> {
    return this.service.get(auth, id, dto);
  }

  @Patch(':id')
  updateAlbumInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAlbumDto,
  ): Promise<AlbumResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  deleteAlbum(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(auth, id);
  }

  @SharedLinkRoute()
  @Put(':id/assets')
  addAssetsToAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  removeAssetFromAlbum(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }

  @Put(':id/users')
  addUsersToAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AddUsersDto,
  ): Promise<AlbumResponseDto> {
    return this.service.addUsers(auth, id, dto);
  }

  @Delete(':id/user/:userId')
  removeUserFromAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.service.removeUser(auth, id, userId);
  }

  @Post('sub-album')
  createSubAlbum(@Auth() auth: AuthDto, @Body() dto: CreateSubAlbumDto) {
    // TODO
  }

  @Delete(':id/sub-album/:childAlbumId')
  removeSubAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Param('childAlbumId', new ParseMeUUIDPipe({ version: '4' })) childAlbumId: string,
  ) {
    // TODO
  }

  @Get(':id/sub-album')
  getAlbumTree(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    // TODO
  }
}
