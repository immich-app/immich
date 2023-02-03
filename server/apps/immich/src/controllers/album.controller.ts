import {
  AddAssetsDto,
  AddAssetsResponseDto,
  AddUsersDto,
  AlbumCountResponseDto,
  AlbumResponseDto,
  AlbumService,
  AuthUserDto,
  CreateAlbumDto,
  CreateAlbumShareLinkDto as CreateAlbumSharedLinkDto,
  DownloadDto,
  GetAlbumsDto,
  RemoveAssetsDto,
  UpdateAlbumDto,
} from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Response,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response as Res } from 'express';
import { ParseMeUUIDPipe } from '../api-v1/validation/parse-me-uuid-pipe';
import { IMMICH_ARCHIVE_COMPLETE, IMMICH_ARCHIVE_FILE_COUNT, IMMICH_CONTENT_LENGTH_HINT } from '../constants';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

// TODO might be worth creating a AlbumParamsDto that validates `albumId` instead of using the pipe.

@ApiBearerAuth()
@ApiTags('Album')
@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Authenticated()
  @Get('count-by-user-id')
  async getAlbumCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    return this.albumService.getAlbumCountByUserId(authUser);
  }

  @Authenticated()
  @Post()
  async createAlbum(@GetAuthUser() authUser: AuthUserDto, @Body(ValidationPipe) createAlbumDto: CreateAlbumDto) {
    return this.albumService.create(authUser, createAlbumDto);
  }

  @Authenticated()
  @Put('/:albumId/users')
  async addUsersToAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) addUsersDto: AddUsersDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
  ) {
    return this.albumService.addUsersToAlbum(authUser, addUsersDto, albumId);
  }

  @Authenticated({ isShared: true })
  @Put('/:albumId/assets')
  async addAssetsToAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) addAssetsDto: AddAssetsDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<AddAssetsResponseDto> {
    return this.albumService.addAssetsToAlbum(authUser, addAssetsDto, albumId);
  }

  @Authenticated()
  @Get()
  async getAllAlbums(
    @GetAuthUser() authUser: AuthUserDto,
    @Query(new ValidationPipe({ transform: true })) query: GetAlbumsDto,
  ) {
    return this.albumService.getAllAlbums(authUser, query);
  }

  @Authenticated({ isShared: true })
  @Get('/:albumId')
  async getAlbumInfo(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
  ) {
    return this.albumService.getAlbumInfo(authUser, albumId);
  }

  @Authenticated()
  @Delete('/:albumId/assets')
  async removeAssetFromAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) removeAssetsDto: RemoveAssetsDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<AlbumResponseDto> {
    return this.albumService.removeAssetsFromAlbum(authUser, removeAssetsDto, albumId);
  }

  @Authenticated()
  @Delete('/:albumId')
  async deleteAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
  ) {
    return this.albumService.deleteAlbum(authUser, albumId);
  }

  @Authenticated()
  @Delete('/:albumId/user/:userId')
  async removeUserFromAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.albumService.removeUserFromAlbum(authUser, albumId, userId);
  }

  @Authenticated()
  @Patch('/:albumId')
  async updateAlbumInfo(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) updateAlbumInfoDto: UpdateAlbumDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
  ) {
    return this.albumService.updateAlbumInfo(authUser, updateAlbumInfoDto, albumId);
  }

  @Authenticated({ isShared: true })
  @Get('/:albumId/download')
  async downloadArchive(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
    @Query(new ValidationPipe({ transform: true })) dto: DownloadDto,
    @Response({ passthrough: true }) res: Res,
  ): Promise<any> {
    this.albumService.checkDownloadAccess(authUser);

    const { stream, fileName, fileSize, fileCount, complete } = await this.albumService.downloadArchive(
      authUser,
      albumId,
      dto,
    );
    res.attachment(fileName);
    res.setHeader(IMMICH_CONTENT_LENGTH_HINT, fileSize);
    res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, fileCount);
    res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${complete}`);
    return stream;
  }

  @Authenticated()
  @Post('/create-shared-link')
  async createAlbumSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) createAlbumShareLinkDto: CreateAlbumSharedLinkDto,
  ) {
    return this.albumService.createAlbumSharedLink(authUser, createAlbumShareLinkDto);
  }
}
