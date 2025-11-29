import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  AddUsersDto,
  AlbumInfoDto,
  AlbumResponseDto,
  AlbumsAddAssetsDto,
  AlbumsAddAssetsResponseDto,
  AlbumStatisticsResponseDto,
  CreateAlbumDto,
  GetAlbumsDto,
  UpdateAlbumDto,
  UpdateAlbumUserDto,
} from 'src/dtos/album.dto';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AlbumService } from 'src/services/album.service';
import { ParseMeUUIDPipe, UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Albums)
@Controller('albums')
export class AlbumController {
  constructor(private service: AlbumService) {}

  @Get()
  @Authenticated({ permission: Permission.AlbumRead })
  @Endpoint({
    summary: 'List all albums',
    description: 'Retrieve a list of albums available to the authenticated user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAllAlbums(@Auth() auth: AuthDto, @Query() query: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    return this.service.getAll(auth, query);
  }

  @Post()
  @Authenticated({ permission: Permission.AlbumCreate })
  @Endpoint({
    summary: 'Create an album',
    description: 'Create a new album. The album can also be created with initial users and assets.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createAlbum(@Auth() auth: AuthDto, @Body() dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.AlbumStatistics })
  @Endpoint({
    summary: 'Retrieve album statistics',
    description: 'Returns statistics about the albums available to the authenticated user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAlbumStatistics(@Auth() auth: AuthDto): Promise<AlbumStatisticsResponseDto> {
    return this.service.getStatistics(auth);
  }

  @Authenticated({ permission: Permission.AlbumRead, sharedLink: true })
  @Get(':id')
  @Endpoint({
    summary: 'Retrieve an album',
    description: 'Retrieve information about a specific album by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAlbumInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: AlbumInfoDto,
  ): Promise<AlbumResponseDto> {
    return this.service.get(auth, id, dto);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.AlbumUpdate })
  @Endpoint({
    summary: 'Update an album',
    description:
      'Update the information of a specific album by its ID. This endpoint can be used to update the album name, description, sort order, etc. However, it is not used to add or remove assets or users from the album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateAlbumInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAlbumDto,
  ): Promise<AlbumResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.AlbumDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete an album',
    description:
      'Delete a specific album by its ID. Note the album is initially trashed and then immediately scheduled for deletion, but relies on a background job to complete the process.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteAlbum(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.AlbumAssetCreate, sharedLink: true })
  @Endpoint({
    summary: 'Add assets to an album',
    description: 'Add multiple assets to a specific album by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  addAssetsToAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Put('assets')
  @Authenticated({ permission: Permission.AlbumAssetCreate, sharedLink: true })
  @Endpoint({
    summary: 'Add assets to albums',
    description: 'Send a list of asset IDs and album IDs to add each asset to each album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  addAssetsToAlbums(@Auth() auth: AuthDto, @Body() dto: AlbumsAddAssetsDto): Promise<AlbumsAddAssetsResponseDto> {
    return this.service.addAssetsToAlbums(auth, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.AlbumAssetDelete })
  @Endpoint({
    summary: 'Remove assets from an album',
    description: 'Remove multiple assets from a specific album by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  removeAssetFromAlbum(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }

  @Put(':id/users')
  @Authenticated({ permission: Permission.AlbumUserCreate })
  @Endpoint({
    summary: 'Share album with users',
    description: 'Share an album with multiple users. Each user can be given a specific role in the album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  addUsersToAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AddUsersDto,
  ): Promise<AlbumResponseDto> {
    return this.service.addUsers(auth, id, dto);
  }

  @Put(':id/user/:userId')
  @Authenticated({ permission: Permission.AlbumUserUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Update user role',
    description: 'Change the role for a specific user in a specific album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateAlbumUser(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateAlbumUserDto,
  ): Promise<void> {
    return this.service.updateUser(auth, id, userId, dto);
  }

  @Delete(':id/user/:userId')
  @Authenticated({ permission: Permission.AlbumUserDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove user from album',
    description: 'Remove a user from an album. Use an ID of "me" to leave a shared album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  removeUserFromAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ): Promise<void> {
    return this.service.removeUser(auth, id, userId);
  }
}
