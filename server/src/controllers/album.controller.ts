import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'List all albums',
    description: 'Retrieve a list of albums available to the authenticated user.',
  })
  getAllAlbums(@Auth() auth: AuthDto, @Query() query: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    return this.service.getAll(auth, query);
  }

  @Post()
  @Authenticated({ permission: Permission.AlbumCreate })
  @ApiOperation({
    summary: 'Create an album',
    description: 'Create a new album. The album can also be created with initial users and assets.',
  })
  createAlbum(@Auth() auth: AuthDto, @Body() dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.AlbumStatistics })
  @ApiOperation({
    summary: 'Retrieve album statistics',
    description: 'Returns statistics about the albums available to the authenticated user.',
  })
  getAlbumStatistics(@Auth() auth: AuthDto): Promise<AlbumStatisticsResponseDto> {
    return this.service.getStatistics(auth);
  }

  @Authenticated({ permission: Permission.AlbumRead, sharedLink: true })
  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve an album',
    description: 'Retrieve information about a specific album by its ID.',
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
  @ApiOperation({
    summary: 'Update an album',
    description:
      'Update the information of a specific album by its ID. This endpoint can be used to update the album name, description, sort order, etc. However, it is not used to add or remove assets or users from the album.',
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
  @ApiOperation({
    summary: 'Delete an album',
    description:
      'Delete a specific album by its ID. Note the album is initially trashed and then immediately scheduled for deletion, but relies on a background job to complete the process.',
  })
  deleteAlbum(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.AlbumAssetCreate, sharedLink: true })
  @ApiOperation({
    summary: 'Add assets to an album',
    description: 'Add multiple assets to a specific album by its ID.',
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
  @ApiOperation({
    summary: 'Add assets to albums',
    description: 'Send a list of asset IDs and album IDs to add each asset to each album.',
  })
  addAssetsToAlbums(@Auth() auth: AuthDto, @Body() dto: AlbumsAddAssetsDto): Promise<AlbumsAddAssetsResponseDto> {
    return this.service.addAssetsToAlbums(auth, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.AlbumAssetDelete })
  @ApiOperation({
    summary: 'Remove assets from an album',
    description: 'Remove multiple assets from a specific album by its ID.',
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
  @ApiOperation({
    summary: 'Share album with users',
    description: 'Share an album with multiple users. Each user can be given a specific role in the album.',
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
  @ApiOperation({
    summary: 'Update user role',
    description: 'Change the role for a specific user in a specific album.',
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
  @ApiOperation({
    summary: 'Remove user from album',
    description: 'Remove a user from an album. Use an ID of "me" to leave a shared album.',
  })
  removeUserFromAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ): Promise<void> {
    return this.service.removeUser(auth, id, userId);
  }
}
