import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlbumCountResponseDto, AlbumResponseDto } from 'src/domain/album/album-response.dto';
import { AlbumService } from 'src/domain/album/album.service';
import { AddUsersDto } from 'src/domain/album/dto/album-add-users.dto';
import { CreateAlbumDto } from 'src/domain/album/dto/album-create.dto';
import { UpdateAlbumDto } from 'src/domain/album/dto/album-update.dto';
import { AlbumInfoDto } from 'src/domain/album/dto/album.dto';
import { GetAlbumsDto } from 'src/domain/album/dto/get-albums.dto';
import { BulkIdResponseDto, BulkIdsDto } from 'src/domain/asset/response-dto/asset-ids-response.dto';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { ParseMeUUIDPipe } from 'src/immich/api-v1/validation/parse-me-uuid-pipe';
import { Auth, Authenticated, SharedLinkRoute } from 'src/immich/app.guard';
import { UUIDParamDto } from 'src/immich/controllers/dto/uuid-param.dto';

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
}
