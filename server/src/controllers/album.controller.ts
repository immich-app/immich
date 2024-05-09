import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AddUsersDto,
  AlbumCountResponseDto,
  AlbumInfoDto,
  AlbumResponseDto,
  CreateAlbumDto,
  GetAlbumsDto,
  UpdateAlbumDto,
  UpdateAlbumUserDto,
} from 'src/dtos/album.dto';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AlbumService } from 'src/services/album.service';
import { ParseMeUUIDPipe, UUIDParamDto } from 'src/validation';

@ApiTags('Album')
@Controller('album')
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Get('count')
  @Authenticated()
  getAlbumCount(@Auth() auth: AuthDto): Promise<AlbumCountResponseDto> {
    return this.service.getCount(auth);
  }

  @Get()
  @Authenticated()
  getAllAlbums(@Auth() auth: AuthDto, @Query() query: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    return this.service.getAll(auth, query);
  }

  @Post()
  @Authenticated()
  createAlbum(@Auth() auth: AuthDto, @Body() dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    return this.service.create(auth, dto);
  }

  @Authenticated({ sharedLink: true })
  @Get(':id')
  getAlbumInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: AlbumInfoDto,
  ): Promise<AlbumResponseDto> {
    return this.service.get(auth, id, dto);
  }

  @Patch(':id')
  @Authenticated()
  updateAlbumInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAlbumDto,
  ): Promise<AlbumResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated()
  deleteAlbum(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ sharedLink: true })
  addAssetsToAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated()
  removeAssetFromAlbum(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }

  @Put(':id/users')
  @Authenticated()
  addUsersToAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AddUsersDto,
  ): Promise<AlbumResponseDto> {
    return this.service.addUsers(auth, id, dto);
  }

  @Put(':id/user/:userId')
  @Authenticated()
  updateAlbumUser(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateAlbumUserDto,
  ): Promise<void> {
    return this.service.updateUser(auth, id, userId, dto);
  }

  @Delete(':id/user/:userId')
  @Authenticated()
  removeUserFromAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.service.removeUser(auth, id, userId);
  }
}
