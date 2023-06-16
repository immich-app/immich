import { AlbumResponseDto } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Response } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response as Res } from 'express';
import { handleDownload } from '../../app.utils';
import { UUIDParamDto } from '../../controllers/dto/uuid-param.dto';
import { AuthUser, AuthUserDto } from '../../decorators/auth-user.decorator';
import { Authenticated, SharedLinkRoute } from '../../decorators/authenticated.decorator';
import { UseValidation } from '../../decorators/use-validation.decorator';
import { DownloadDto } from '../asset/dto/download-library.dto';
import { AlbumService } from './album.service';
import { AddAssetsDto } from './dto/add-assets.dto';
import { CreateAlbumShareLinkDto as CreateAlbumSharedLinkDto } from './dto/create-album-shared-link.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';

@ApiTags('Album')
@Controller('album')
@Authenticated()
@UseValidation()
export class AlbumController {
  constructor(private readonly service: AlbumService) {}

  @SharedLinkRoute()
  @Put(':id/assets')
  addAssetsToAlbum(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AddAssetsDto,
  ): Promise<AddAssetsResponseDto> {
    // TODO: Handle nonexistent assetIds.
    // TODO: Disallow adding assets of another user to an album.
    return this.service.addAssets(authUser, id, dto);
  }

  @SharedLinkRoute()
  @Get(':id')
  getAlbumInfo(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.get(authUser, id);
  }

  @Delete(':id/assets')
  removeAssetFromAlbum(
    @AuthUser() authUser: AuthUserDto,
    @Body() dto: RemoveAssetsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<AlbumResponseDto> {
    return this.service.removeAssets(authUser, id, dto);
  }

  @SharedLinkRoute()
  @Get(':id/download')
  @ApiOkResponse({ content: { 'application/zip': { schema: { type: 'string', format: 'binary' } } } })
  downloadArchive(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: DownloadDto,
    @Response({ passthrough: true }) res: Res,
  ) {
    return this.service.downloadArchive(authUser, id, dto).then((download) => handleDownload(download, res));
  }

  @Post('create-shared-link')
  createAlbumSharedLink(@AuthUser() authUser: AuthUserDto, @Body() dto: CreateAlbumSharedLinkDto) {
    return this.service.createSharedLink(authUser, dto);
  }
}
