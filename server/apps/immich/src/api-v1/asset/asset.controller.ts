import { AddAssetsDto } from './../album/dto/add-assets.dto';
import {
  Controller,
  Post,
  UseInterceptors,
  Body,
  Get,
  Param,
  ValidationPipe,
  Query,
  Response,
  Headers,
  Delete,
  HttpCode,
  Header,
  Put,
  UploadedFiles,
  Patch,
  StreamableFile,
  ParseFilePipe,
} from '@nestjs/common';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AssetService } from './asset.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { ServeFileDto } from './dto/serve-file.dto';
import { Response as Res } from 'express';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import { CheckDuplicateAssetDto } from './dto/check-duplicate-asset.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { AssetResponseDto, ImmichReadStream } from '@app/domain';
import { CheckDuplicateAssetResponseDto } from './response-dto/check-duplicate-asset-response.dto';
import { CreateAssetDto, mapToUploadFile } from './dto/create-asset.dto';
import { AssetFileUploadResponseDto } from './response-dto/asset-file-upload-response.dto';
import { DeleteAssetResponseDto } from './response-dto/delete-asset-response.dto';
import { GetAssetThumbnailDto } from './dto/get-asset-thumbnail.dto';
import { AssetCountByTimeBucketResponseDto } from './response-dto/asset-count-by-time-group-response.dto';
import { GetAssetCountByTimeBucketDto } from './dto/get-asset-count-by-time-bucket.dto';
import { GetAssetByTimeBucketDto } from './dto/get-asset-by-time-bucket.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { DownloadDto } from './dto/download-library.dto';
import {
  IMMICH_ARCHIVE_COMPLETE,
  IMMICH_ARCHIVE_FILE_COUNT,
  IMMICH_CONTENT_LENGTH_HINT,
} from '../../constants/download.constant';
import { DownloadFilesDto } from './dto/download-files.dto';
import { CreateAssetsShareLinkDto } from './dto/create-asset-shared-link.dto';
import { SharedLinkResponseDto } from '@app/domain';
import { AssetSearchDto } from './dto/asset-search.dto';
import { assetUploadOption, ImmichFile } from '../../config/asset-upload.config';
import FileNotEmptyValidator from '../validation/file-not-empty-validator';
import { RemoveAssetsDto } from '../album/dto/remove-assets.dto';

function asStreamableFile({ stream, type, length }: ImmichReadStream) {
  return new StreamableFile(stream, { type, length });
}

@ApiBearerAuth()
@ApiTags('Asset')
@Controller('asset')
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Authenticated({ isShared: true })
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'assetData', maxCount: 1 },
        { name: 'livePhotoData', maxCount: 1 },
      ],
      assetUploadOption,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset Upload Information',
    type: CreateAssetDto,
  })
  async uploadFile(
    @GetAuthUser() authUser: AuthUserDto,
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator(['assetData'])] }))
    files: { assetData: ImmichFile[]; livePhotoData?: ImmichFile[] },
    @Body(new ValidationPipe()) dto: CreateAssetDto,
    @Response({ passthrough: true }) res: Res,
  ): Promise<AssetFileUploadResponseDto> {
    const file = mapToUploadFile(files.assetData[0]);
    const _livePhotoFile = files.livePhotoData?.[0];
    let livePhotoFile;
    if (_livePhotoFile) {
      livePhotoFile = mapToUploadFile(_livePhotoFile);
    }

    const responseDto = await this.assetService.uploadFile(authUser, dto, file, livePhotoFile);
    if (responseDto.duplicate) {
      res.status(200);
    }

    return responseDto;
  }

  @Authenticated({ isShared: true })
  @Get('/download/:assetId')
  async downloadFile(
    @GetAuthUser() authUser: AuthUserDto,
    @Response({ passthrough: true }) res: Res,
    @Param('assetId') assetId: string,
  ): Promise<any> {
    return this.assetService.downloadFile(authUser, assetId).then(asStreamableFile);
  }

  @Authenticated({ isShared: true })
  @Post('/download-files')
  async downloadFiles(
    @GetAuthUser() authUser: AuthUserDto,
    @Response({ passthrough: true }) res: Res,
    @Body(new ValidationPipe()) dto: DownloadFilesDto,
  ): Promise<any> {
    this.assetService.checkDownloadAccess(authUser);
    await this.assetService.checkAssetsAccess(authUser, [...dto.assetIds]);
    const { stream, fileName, fileSize, fileCount, complete } = await this.assetService.downloadFiles(dto);
    res.attachment(fileName);
    res.setHeader(IMMICH_CONTENT_LENGTH_HINT, fileSize);
    res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, fileCount);
    res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${complete}`);
    return stream;
  }

  /**
   * Current this is not used in any UI element
   */
  @Authenticated({ isShared: true })
  @Get('/download-library')
  async downloadLibrary(
    @GetAuthUser() authUser: AuthUserDto,
    @Query(new ValidationPipe({ transform: true })) dto: DownloadDto,
    @Response({ passthrough: true }) res: Res,
  ): Promise<any> {
    this.assetService.checkDownloadAccess(authUser);
    const { stream, fileName, fileSize, fileCount, complete } = await this.assetService.downloadLibrary(authUser, dto);
    res.attachment(fileName);
    res.setHeader(IMMICH_CONTENT_LENGTH_HINT, fileSize);
    res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, fileCount);
    res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${complete}`);
    return stream;
  }

  @Authenticated({ isShared: true })
  @Get('/file/:assetId')
  @Header('Cache-Control', 'max-age=31536000')
  async serveFile(
    @GetAuthUser() authUser: AuthUserDto,
    @Headers() headers: Record<string, string>,
    @Response({ passthrough: true }) res: Res,
    @Query(new ValidationPipe({ transform: true })) query: ServeFileDto,
    @Param('assetId') assetId: string,
  ): Promise<any> {
    await this.assetService.checkAssetsAccess(authUser, [assetId]);
    return this.assetService.serveFile(authUser, assetId, query, res, headers);
  }

  @Authenticated({ isShared: true })
  @Get('/thumbnail/:assetId')
  @Header('Cache-Control', 'max-age=31536000')
  async getAssetThumbnail(
    @GetAuthUser() authUser: AuthUserDto,
    @Headers() headers: Record<string, string>,
    @Response({ passthrough: true }) res: Res,
    @Param('assetId') assetId: string,
    @Query(new ValidationPipe({ transform: true })) query: GetAssetThumbnailDto,
  ): Promise<any> {
    await this.assetService.checkAssetsAccess(authUser, [assetId]);
    return this.assetService.getAssetThumbnail(assetId, query, res, headers);
  }

  @Authenticated()
  @Get('/curated-objects')
  async getCuratedObjects(@GetAuthUser() authUser: AuthUserDto): Promise<CuratedObjectsResponseDto[]> {
    return this.assetService.getCuratedObject(authUser);
  }

  @Authenticated()
  @Get('/curated-locations')
  async getCuratedLocations(@GetAuthUser() authUser: AuthUserDto): Promise<CuratedLocationsResponseDto[]> {
    return this.assetService.getCuratedLocation(authUser);
  }

  @Authenticated()
  @Get('/search-terms')
  async getAssetSearchTerms(@GetAuthUser() authUser: AuthUserDto): Promise<string[]> {
    return this.assetService.getAssetSearchTerm(authUser);
  }

  @Authenticated()
  @Post('/search')
  async searchAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) searchAssetDto: SearchAssetDto,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.searchAsset(authUser, searchAssetDto);
  }

  @Authenticated()
  @Post('/count-by-time-bucket')
  async getAssetCountByTimeBucket(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) getAssetCountByTimeGroupDto: GetAssetCountByTimeBucketDto,
  ): Promise<AssetCountByTimeBucketResponseDto> {
    return this.assetService.getAssetCountByTimeBucket(authUser, getAssetCountByTimeGroupDto);
  }

  @Authenticated()
  @Get('/count-by-user-id')
  async getAssetCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this.assetService.getAssetCountByUserId(authUser);
  }

  /**
   * Get all AssetEntity belong to the user
   */
  @Authenticated()
  @Get('/')
  @ApiHeader({
    name: 'if-none-match',
    description: 'ETag of data already cached on the client',
    required: false,
    schema: { type: 'string' },
  })
  getAllAssets(
    @GetAuthUser() authUser: AuthUserDto,
    @Query(new ValidationPipe({ transform: true })) dto: AssetSearchDto,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.getAllAssets(authUser, dto);
  }

  @Authenticated()
  @Post('/time-bucket')
  async getAssetByTimeBucket(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) getAssetByTimeBucketDto: GetAssetByTimeBucketDto,
  ): Promise<AssetResponseDto[]> {
    return await this.assetService.getAssetByTimeBucket(authUser, getAssetByTimeBucketDto);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Authenticated()
  @Get('/:deviceId')
  async getUserAssetsByDeviceId(@GetAuthUser() authUser: AuthUserDto, @Param('deviceId') deviceId: string) {
    return await this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }

  /**
   * Get a single asset's information
   */
  @Authenticated({ isShared: true })
  @Get('/assetById/:assetId')
  async getAssetById(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('assetId') assetId: string,
  ): Promise<AssetResponseDto> {
    await this.assetService.checkAssetsAccess(authUser, [assetId]);
    return await this.assetService.getAssetById(authUser, assetId);
  }

  /**
   * Update an asset
   */
  @Authenticated()
  @Put('/:assetId')
  async updateAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('assetId') assetId: string,
    @Body(ValidationPipe) dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    await this.assetService.checkAssetsAccess(authUser, [assetId], true);
    return await this.assetService.updateAsset(authUser, assetId, dto);
  }

  @Authenticated()
  @Delete('/')
  async deleteAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: DeleteAssetDto,
  ): Promise<DeleteAssetResponseDto[]> {
    await this.assetService.checkAssetsAccess(authUser, dto.ids, true);
    return this.assetService.deleteAll(authUser, dto);
  }

  /**
   * Check duplicated asset before uploading - for Web upload used
   */
  @Authenticated({ isShared: true })
  @Post('/check')
  @HttpCode(200)
  async checkDuplicateAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) checkDuplicateAssetDto: CheckDuplicateAssetDto,
  ): Promise<CheckDuplicateAssetResponseDto> {
    return await this.assetService.checkDuplicatedAsset(authUser, checkDuplicateAssetDto);
  }

  /**
   * Checks if multiple assets exist on the server and returns all existing - used by background backup
   */
  @Authenticated()
  @Post('/exist')
  @HttpCode(200)
  async checkExistingAssets(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) checkExistingAssetsDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return await this.assetService.checkExistingAssets(authUser, checkExistingAssetsDto);
  }

  @Authenticated()
  @Post('/shared-link')
  async createAssetsSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: CreateAssetsShareLinkDto,
  ): Promise<SharedLinkResponseDto> {
    return await this.assetService.createAssetsSharedLink(authUser, dto);
  }

  @Authenticated({ isShared: true })
  @Patch('/shared-link/add')
  async addAssetsToSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: AddAssetsDto,
  ): Promise<SharedLinkResponseDto> {
    return await this.assetService.addAssetsToSharedLink(authUser, dto);
  }

  @Authenticated({ isShared: true })
  @Patch('/shared-link/remove')
  async removeAssetsFromSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: RemoveAssetsDto,
  ): Promise<SharedLinkResponseDto> {
    return await this.assetService.removeAssetsFromSharedLink(authUser, dto);
  }
}
