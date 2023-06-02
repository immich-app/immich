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
import { Authenticated, SharedLinkRoute } from '../../decorators/authenticated.decorator';
import { AssetService } from './asset.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { ServeFileDto } from './dto/serve-file.dto';
import { Response as Res } from 'express';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import { CheckDuplicateAssetDto } from './dto/check-duplicate-asset.dto';
import { ApiBody, ApiConsumes, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
import { AssetBulkUploadCheckDto } from './dto/asset-check.dto';
import { AssetBulkUploadCheckResponseDto } from './response-dto/asset-check-response.dto';
import { AssetIdDto } from './dto/asset-id.dto';
import { DeviceIdDto } from './dto/device-id.dto';

function asStreamableFile({ stream, type, length }: ImmichReadStream) {
  return new StreamableFile(stream, { type, length });
}

interface UploadFiles {
  assetData: ImmichFile[];
  livePhotoData?: ImmichFile[];
  sidecarData: ImmichFile[];
}

@ApiTags('Asset')
@Controller('asset')
@Authenticated()
export class AssetController {
  constructor(private assetService: AssetService) {}

  @SharedLinkRoute()
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'assetData', maxCount: 1 },
        { name: 'livePhotoData', maxCount: 1 },
        { name: 'sidecarData', maxCount: 1 },
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
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator(['assetData'])] })) files: UploadFiles,
    @Body(new ValidationPipe()) dto: CreateAssetDto,
    @Response({ passthrough: true }) res: Res,
  ): Promise<AssetFileUploadResponseDto> {
    const file = mapToUploadFile(files.assetData[0]);
    const _livePhotoFile = files.livePhotoData?.[0];
    const _sidecarFile = files.sidecarData?.[0];
    let livePhotoFile;
    if (_livePhotoFile) {
      livePhotoFile = mapToUploadFile(_livePhotoFile);
    }

    let sidecarFile;
    if (_sidecarFile) {
      sidecarFile = mapToUploadFile(_sidecarFile);
    }

    const responseDto = await this.assetService.uploadFile(authUser, dto, file, livePhotoFile, sidecarFile);
    if (responseDto.duplicate) {
      res.status(200);
    }

    return responseDto;
  }

  @SharedLinkRoute()
  @Get('/download/:assetId')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  downloadFile(@GetAuthUser() authUser: AuthUserDto, @Param() { assetId }: AssetIdDto) {
    return this.assetService.downloadFile(authUser, assetId).then(asStreamableFile);
  }

  @SharedLinkRoute()
  @Post('/download-files')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  async downloadFiles(
    @GetAuthUser() authUser: AuthUserDto,
    @Response({ passthrough: true }) res: Res,
    @Body(new ValidationPipe()) dto: DownloadFilesDto,
  ) {
    const { stream, fileName, fileSize, fileCount, complete } = await this.assetService.downloadFiles(authUser, dto);
    res.attachment(fileName);
    res.setHeader(IMMICH_CONTENT_LENGTH_HINT, fileSize);
    res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, fileCount);
    res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${complete}`);
    return stream;
  }

  /**
   * Current this is not used in any UI element
   */
  @SharedLinkRoute()
  @Get('/download-library')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  async downloadLibrary(
    @GetAuthUser() authUser: AuthUserDto,
    @Query(new ValidationPipe({ transform: true })) dto: DownloadDto,
    @Response({ passthrough: true }) res: Res,
  ) {
    const { stream, fileName, fileSize, fileCount, complete } = await this.assetService.downloadLibrary(authUser, dto);
    res.attachment(fileName);
    res.setHeader(IMMICH_CONTENT_LENGTH_HINT, fileSize);
    res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, fileCount);
    res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${complete}`);
    return stream;
  }

  @SharedLinkRoute()
  @Get('/file/:assetId')
  @Header('Cache-Control', 'max-age=31536000')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  serveFile(
    @GetAuthUser() authUser: AuthUserDto,
    @Headers() headers: Record<string, string>,
    @Response({ passthrough: true }) res: Res,
    @Query(new ValidationPipe({ transform: true })) query: ServeFileDto,
    @Param() { assetId }: AssetIdDto,
  ) {
    return this.assetService.serveFile(authUser, assetId, query, res, headers);
  }

  @SharedLinkRoute()
  @Get('/thumbnail/:assetId')
  @Header('Cache-Control', 'max-age=31536000')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  getAssetThumbnail(
    @GetAuthUser() authUser: AuthUserDto,
    @Headers() headers: Record<string, string>,
    @Response({ passthrough: true }) res: Res,
    @Param() { assetId }: AssetIdDto,
    @Query(new ValidationPipe({ transform: true })) query: GetAssetThumbnailDto,
  ) {
    return this.assetService.getAssetThumbnail(authUser, assetId, query, res, headers);
  }

  @Get('/curated-objects')
  getCuratedObjects(@GetAuthUser() authUser: AuthUserDto): Promise<CuratedObjectsResponseDto[]> {
    return this.assetService.getCuratedObject(authUser);
  }

  @Get('/curated-locations')
  getCuratedLocations(@GetAuthUser() authUser: AuthUserDto): Promise<CuratedLocationsResponseDto[]> {
    return this.assetService.getCuratedLocation(authUser);
  }

  @Get('/search-terms')
  getAssetSearchTerms(@GetAuthUser() authUser: AuthUserDto): Promise<string[]> {
    return this.assetService.getAssetSearchTerm(authUser);
  }

  @Post('/search')
  searchAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: SearchAssetDto,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.searchAsset(authUser, dto);
  }

  @Post('/count-by-time-bucket')
  getAssetCountByTimeBucket(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: GetAssetCountByTimeBucketDto,
  ): Promise<AssetCountByTimeBucketResponseDto> {
    return this.assetService.getAssetCountByTimeBucket(authUser, dto);
  }

  @Get('/count-by-user-id')
  getAssetCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this.assetService.getAssetCountByUserId(authUser);
  }

  @Get('/stat/archive')
  getArchivedAssetCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this.assetService.getArchivedAssetCountByUserId(authUser);
  }
  /**
   * Get all AssetEntity belong to the user
   */
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

  @Post('/time-bucket')
  getAssetByTimeBucket(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: GetAssetByTimeBucketDto,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.getAssetByTimeBucket(authUser, dto);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Get('/:deviceId')
  getUserAssetsByDeviceId(@GetAuthUser() authUser: AuthUserDto, @Param() { deviceId }: DeviceIdDto) {
    return this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }

  /**
   * Get a single asset's information
   */
  @SharedLinkRoute()
  @Get('/assetById/:assetId')
  getAssetById(@GetAuthUser() authUser: AuthUserDto, @Param() { assetId }: AssetIdDto): Promise<AssetResponseDto> {
    return this.assetService.getAssetById(authUser, assetId);
  }

  /**
   * Update an asset
   */
  @Put('/:assetId')
  updateAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { assetId }: AssetIdDto,
    @Body(ValidationPipe) dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.assetService.updateAsset(authUser, assetId, dto);
  }

  @Delete('/')
  deleteAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: DeleteAssetDto,
  ): Promise<DeleteAssetResponseDto[]> {
    return this.assetService.deleteAll(authUser, dto);
  }

  /**
   * Check duplicated asset before uploading - for Web upload used
   */
  @SharedLinkRoute()
  @Post('/check')
  @HttpCode(200)
  checkDuplicateAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: CheckDuplicateAssetDto,
  ): Promise<CheckDuplicateAssetResponseDto> {
    return this.assetService.checkDuplicatedAsset(authUser, dto);
  }

  /**
   * Checks if multiple assets exist on the server and returns all existing - used by background backup
   */
  @Post('/exist')
  @HttpCode(200)
  checkExistingAssets(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return this.assetService.checkExistingAssets(authUser, dto);
  }

  /**
   * Checks if assets exist by checksums
   */
  @Post('/bulk-upload-check')
  @HttpCode(200)
  bulkUploadCheck(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: AssetBulkUploadCheckDto,
  ): Promise<AssetBulkUploadCheckResponseDto> {
    return this.assetService.bulkUploadCheck(authUser, dto);
  }

  @Post('/shared-link')
  createAssetsSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: CreateAssetsShareLinkDto,
  ): Promise<SharedLinkResponseDto> {
    return this.assetService.createAssetsSharedLink(authUser, dto);
  }

  @SharedLinkRoute()
  @Patch('/shared-link/add')
  addAssetsToSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: AddAssetsDto,
  ): Promise<SharedLinkResponseDto> {
    return this.assetService.addAssetsToSharedLink(authUser, dto);
  }

  @SharedLinkRoute()
  @Patch('/shared-link/remove')
  removeAssetsFromSharedLink(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: RemoveAssetsDto,
  ): Promise<SharedLinkResponseDto> {
    return this.assetService.removeAssetsFromSharedLink(authUser, dto);
  }
}
