import { Controller, Get, Post, Body, Param, Delete, Put, Query, Response } from '@nestjs/common';
import { ParseMeUUIDPipe } from '../validation/parse-me-uuid-pipe';
import { AlbumService } from './album.service';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { AddAssetsDto } from './dto/add-assets.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AlbumResponseDto } from '@app/domain';
import { AlbumCountResponseDto } from './response-dto/album-count-response.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';
import { Response as Res } from 'express';
import {
  IMMICH_ARCHIVE_COMPLETE,
  IMMICH_ARCHIVE_FILE_COUNT,
  IMMICH_CONTENT_LENGTH_HINT,
} from '../../constants/download.constant';
import { DownloadDto } from '../asset/dto/download-library.dto';
import { CreateAlbumShareLinkDto as CreateAlbumSharedLinkDto } from './dto/create-album-shared-link.dto';
import { UseValidation } from '../../decorators/use-validation.decorator';
import { UUIDParamDto } from '../../controllers/dto/uuid-param.dto';
import { DownloadArchive } from '../../modules/download/download.service';

const handleDownload = (download: DownloadArchive, res: Res) => {
  res.attachment(download.fileName);
  res.setHeader(IMMICH_CONTENT_LENGTH_HINT, download.fileSize);
  res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, download.fileCount);
  res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${download.complete}`);
  return download.stream;
};

@ApiTags('Album')
@Controller('album')
@UseValidation()
export class AlbumController {
  constructor(private readonly service: AlbumService) {}

  @Authenticated()
  @Get('count-by-user-id')
  getAlbumCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    return this.service.getCountByUserId(authUser);
  }

  @Authenticated()
  @Put(':id/users')
  addUsersToAlbum(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto, @Body() dto: AddUsersDto) {
    // TODO: Handle nonexistent sharedUserIds.
    return this.service.addUsers(authUser, id, dto);
  }

  @Authenticated({ isShared: true })
  @Put(':id/assets')
  addAssetsToAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AddAssetsDto,
  ): Promise<AddAssetsResponseDto> {
    // TODO: Handle nonexistent assetIds.
    // TODO: Disallow adding assets of another user to an album.
    return this.service.addAssets(authUser, id, dto);
  }

  @Authenticated({ isShared: true })
  @Get(':id')
  getAlbumInfo(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.get(authUser, id);
  }

  @Authenticated()
  @Delete(':id/assets')
  removeAssetFromAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body() dto: RemoveAssetsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<AlbumResponseDto> {
    return this.service.removeAssets(authUser, id, dto);
  }

  @Authenticated()
  @Delete(':id')
  deleteAlbum(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.delete(authUser, id);
  }

  @Authenticated()
  @Delete(':id/user/:userId')
  removeUserFromAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('userId', new ParseMeUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.service.removeUser(authUser, id, userId);
  }

  @Authenticated({ isShared: true })
  @Get(':id/download')
  @ApiOkResponse({ content: { 'application/zip': { schema: { type: 'string', format: 'binary' } } } })
  downloadArchive(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: DownloadDto,
    @Response({ passthrough: true }) res: Res,
  ) {
    this.service.checkDownloadAccess(authUser);
    return this.service.downloadArchive(authUser, id, dto).then((download) => handleDownload(download, res));
  }

  @Authenticated()
  @Post('create-shared-link')
  createAlbumSharedLink(@GetAuthUser() authUser: AuthUserDto, @Body() dto: CreateAlbumSharedLinkDto) {
    return this.service.createSharedLink(authUser, dto);
  }
}
