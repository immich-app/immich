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
} from '@nestjs/common';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AssetService } from './asset.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { assetUploadOption } from '../../config/asset-upload.config';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { ServeFileDto } from './dto/serve-file.dto';
import { Response as Res } from 'express';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import { CheckDuplicateAssetDto } from './dto/check-duplicate-asset.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { AssetResponseDto } from './response-dto/asset-response.dto';
import { CheckDuplicateAssetResponseDto } from './response-dto/check-duplicate-asset-response.dto';
import { AssetFileUploadDto } from './dto/asset-file-upload.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AssetFileUploadResponseDto } from './response-dto/asset-file-upload-response.dto';
import { DeleteAssetResponseDto, DeleteAssetStatusEnum } from './response-dto/delete-asset-response.dto';
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

@Authenticated()
@ApiBearerAuth()
@ApiTags('Asset')
@Controller('asset')
export class AssetController {
  constructor(private assetService: AssetService, private backgroundTaskService: BackgroundTaskService) {}

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
    type: AssetFileUploadDto,
  })
  async uploadFile(
    @GetAuthUser() authUser: AuthUserDto,
    @UploadedFiles() files: { assetData: Express.Multer.File[]; livePhotoData?: Express.Multer.File[] },
    @Body(ValidationPipe) createAssetDto: CreateAssetDto,
    @Response({ passthrough: true }) res: Res,
  ): Promise<AssetFileUploadResponseDto> {
    const originalAssetData = files.assetData[0];
    const livePhotoAssetData = files.livePhotoData?.[0];

    return this.assetService.handleUploadedAsset(authUser, createAssetDto, res, originalAssetData, livePhotoAssetData);
  }

  @Get('/download/:assetId')
  async downloadFile(
    @GetAuthUser() authUser: AuthUserDto,
    @Response({ passthrough: true }) res: Res,
    @Query(new ValidationPipe({ transform: true })) query: ServeFileDto,
    @Param('assetId') assetId: string,
  ): Promise<any> {
    await this.assetService.checkAssetsAccess(authUser, [assetId]);
    return this.assetService.downloadFile(query, assetId, res);
  }

  @Get('/download-library')
  async downloadLibrary(
    @GetAuthUser() authUser: AuthUserDto,
    @Query(new ValidationPipe({ transform: true })) dto: DownloadDto,
    @Response({ passthrough: true }) res: Res,
  ): Promise<any> {
    const { stream, fileName, fileSize, fileCount, complete } = await this.assetService.downloadLibrary(authUser, dto);
    res.attachment(fileName);
    res.setHeader(IMMICH_CONTENT_LENGTH_HINT, fileSize);
    res.setHeader(IMMICH_ARCHIVE_FILE_COUNT, fileCount);
    res.setHeader(IMMICH_ARCHIVE_COMPLETE, `${complete}`);
    return stream;
  }

  @Get('/file/:assetId')
  @Header('Cache-Control', 'max-age=3600')
  async serveFile(
    @GetAuthUser() authUser: AuthUserDto,
    @Headers() headers: Record<string, string>,
    @Response({ passthrough: true }) res: Res,
    @Query(new ValidationPipe({ transform: true })) query: ServeFileDto,
    @Param('assetId') assetId: string,
  ): Promise<any> {
    await this.assetService.checkAssetsAccess(authUser, [assetId]);
    return this.assetService.serveFile(assetId, query, res, headers);
  }

  @Get('/thumbnail/:assetId')
  @Header('Cache-Control', 'max-age=3600')
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

  @Get('/curated-objects')
  async getCuratedObjects(@GetAuthUser() authUser: AuthUserDto): Promise<CuratedObjectsResponseDto[]> {
    return this.assetService.getCuratedObject(authUser);
  }

  @Get('/curated-locations')
  async getCuratedLocations(@GetAuthUser() authUser: AuthUserDto): Promise<CuratedLocationsResponseDto[]> {
    return this.assetService.getCuratedLocation(authUser);
  }

  @Get('/search-terms')
  async getAssetSearchTerms(@GetAuthUser() authUser: AuthUserDto): Promise<string[]> {
    return this.assetService.getAssetSearchTerm(authUser);
  }

  @Post('/search')
  async searchAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) searchAssetDto: SearchAssetDto,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.searchAsset(authUser, searchAssetDto);
  }

  @Post('/count-by-time-bucket')
  async getAssetCountByTimeBucket(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) getAssetCountByTimeGroupDto: GetAssetCountByTimeBucketDto,
  ): Promise<AssetCountByTimeBucketResponseDto> {
    return this.assetService.getAssetCountByTimeBucket(authUser, getAssetCountByTimeGroupDto);
  }

  @Get('/count-by-user-id')
  async getAssetCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this.assetService.getAssetCountByUserId(authUser);
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
  async getAllAssets(@GetAuthUser() authUser: AuthUserDto): Promise<AssetResponseDto[]> {
    const assets = await this.assetService.getAllAssets(authUser);
    return assets;
  }

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
  @Get('/:deviceId')
  async getUserAssetsByDeviceId(@GetAuthUser() authUser: AuthUserDto, @Param('deviceId') deviceId: string) {
    return await this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }

  /**
   * Get a single asset's information
   */
  @Get('/assetById/:assetId')
  async getAssetById(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('assetId') assetId: string,
  ): Promise<AssetResponseDto> {
    await this.assetService.checkAssetsAccess(authUser, [assetId]);
    return await this.assetService.getAssetById(assetId);
  }

  /**
   * Update an asset
   */
  @Put('/:assetId')
  async updateAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('assetId') assetId: string,
    @Body(ValidationPipe) dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    await this.assetService.checkAssetsAccess(authUser, [assetId], true);
    return await this.assetService.updateAsset(authUser, assetId, dto);
  }

  @Delete('/')
  async deleteAsset(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) assetIds: DeleteAssetDto,
  ): Promise<DeleteAssetResponseDto[]> {
    await this.assetService.checkAssetsAccess(authUser, assetIds.ids, true);

    const deleteAssetList: AssetResponseDto[] = [];

    for (const id of assetIds.ids) {
      const assets = await this.assetService.getAssetById(id);
      if (!assets) {
        continue;
      }
      deleteAssetList.push(assets);

      if (assets.livePhotoVideoId) {
        const livePhotoVideo = await this.assetService.getAssetById(assets.livePhotoVideoId);
        if (livePhotoVideo) {
          deleteAssetList.push(livePhotoVideo);
          assetIds.ids = [...assetIds.ids, livePhotoVideo.id];
        }
      }
    }

    const result = await this.assetService.deleteAssetById(assetIds);

    result.forEach((res) => {
      deleteAssetList.filter((a) => a.id == res.id && res.status == DeleteAssetStatusEnum.SUCCESS);
    });

    await this.backgroundTaskService.deleteFileOnDisk(deleteAssetList);

    return result;
  }

  /**
   * Check duplicated asset before uploading - for Web upload used
   */
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
  @Post('/exist')
  @HttpCode(200)
  async checkExistingAssets(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) checkExistingAssetsDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return await this.assetService.checkExistingAssets(authUser, checkExistingAssetsDto);
  }
}
