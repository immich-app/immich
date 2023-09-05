import { AssetResponseDto, AuthUserDto } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Response,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response as Res } from 'express';
import { AuthUser, Authenticated, SharedLinkRoute } from '../../app.guard';
import { FileUploadInterceptor, ImmichFile, Route, mapToUploadFile } from '../../app.interceptor';
import { UUIDParamDto } from '../../controllers/dto/uuid-param.dto';
import FileNotEmptyValidator from '../validation/file-not-empty-validator';
import { AssetService } from './asset.service';
import { AssetBulkUploadCheckDto } from './dto/asset-check.dto';
import { AssetSearchDto } from './dto/asset-search.dto';
import { CheckDuplicateAssetDto } from './dto/check-duplicate-asset.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CreateAssetDto, ImportAssetDto } from './dto/create-asset.dto';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { DeviceIdDto } from './dto/device-id.dto';
import { GetAssetThumbnailDto } from './dto/get-asset-thumbnail.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import { ServeFileDto } from './dto/serve-file.dto';
import { AssetBulkUploadCheckResponseDto } from './response-dto/asset-check-response.dto';
import { AssetFileUploadResponseDto } from './response-dto/asset-file-upload-response.dto';
import { CheckDuplicateAssetResponseDto } from './response-dto/check-duplicate-asset-response.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';
import { DeleteAssetResponseDto } from './response-dto/delete-asset-response.dto';

interface UploadFiles {
  assetData: ImmichFile[];
  livePhotoData?: ImmichFile[];
  sidecarData: ImmichFile[];
}

@ApiTags('Asset')
@Controller(Route.ASSET)
@Authenticated()
export class AssetController {
  constructor(private assetService: AssetService) {}

  @SharedLinkRoute()
  @Post('upload')
  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset Upload Information',
    type: CreateAssetDto,
  })
  async uploadFile(
    @AuthUser() authUser: AuthUserDto,
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
      res.status(HttpStatus.OK);
    }

    return responseDto;
  }

  @Post('import')
  async importFile(
    @AuthUser() authUser: AuthUserDto,
    @Body(new ValidationPipe()) dto: ImportAssetDto,
    @Response({ passthrough: true }) res: Res,
  ): Promise<AssetFileUploadResponseDto> {
    const responseDto = await this.assetService.importFile(authUser, dto);
    if (responseDto.duplicate) {
      res.status(200);
    }

    return responseDto;
  }

  @SharedLinkRoute()
  @Get('/file/:id')
  @ApiOkResponse({
    content: {
      'application/octet-stream': { schema: { type: 'string', format: 'binary' } },
    },
  })
  async serveFile(
    @AuthUser() authUser: AuthUserDto,
    @Response() res: Res,
    @Query(new ValidationPipe({ transform: true })) query: ServeFileDto,
    @Param() { id }: UUIDParamDto,
  ) {
    await this.assetService.serveFile(authUser, id, query, res);
  }

  @SharedLinkRoute()
  @Get('/thumbnail/:id')
  @ApiOkResponse({
    content: {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/webp': { schema: { type: 'string', format: 'binary' } },
    },
  })
  async getAssetThumbnail(
    @AuthUser() authUser: AuthUserDto,
    @Response() res: Res,
    @Param() { id }: UUIDParamDto,
    @Query(new ValidationPipe({ transform: true })) query: GetAssetThumbnailDto,
  ) {
    await this.assetService.serveThumbnail(authUser, id, query, res);
  }

  @Get('/curated-objects')
  getCuratedObjects(@AuthUser() authUser: AuthUserDto): Promise<CuratedObjectsResponseDto[]> {
    return this.assetService.getCuratedObject(authUser);
  }

  @Get('/curated-locations')
  getCuratedLocations(@AuthUser() authUser: AuthUserDto): Promise<CuratedLocationsResponseDto[]> {
    return this.assetService.getCuratedLocation(authUser);
  }

  @Get('/search-terms')
  getAssetSearchTerms(@AuthUser() authUser: AuthUserDto): Promise<string[]> {
    return this.assetService.getAssetSearchTerm(authUser);
  }

  @Post('/search')
  @HttpCode(HttpStatus.OK)
  searchAsset(
    @AuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: SearchAssetDto,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.searchAsset(authUser, dto);
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
    @AuthUser() authUser: AuthUserDto,
    @Query(new ValidationPipe({ transform: true })) dto: AssetSearchDto,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.getAllAssets(authUser, dto);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Get('/:deviceId')
  getUserAssetsByDeviceId(@AuthUser() authUser: AuthUserDto, @Param() { deviceId }: DeviceIdDto) {
    return this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }

  /**
   * Get a single asset's information
   */
  @SharedLinkRoute()
  @Get('/assetById/:id')
  getAssetById(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto> {
    return this.assetService.getAssetById(authUser, id);
  }

  @Delete('/')
  deleteAsset(
    @AuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: DeleteAssetDto,
  ): Promise<DeleteAssetResponseDto[]> {
    return this.assetService.deleteAll(authUser, dto);
  }

  /**
   * Check duplicated asset before uploading - for Web upload used
   */
  @SharedLinkRoute()
  @Post('/check')
  @HttpCode(HttpStatus.OK)
  checkDuplicateAsset(
    @AuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: CheckDuplicateAssetDto,
  ): Promise<CheckDuplicateAssetResponseDto> {
    return this.assetService.checkDuplicatedAsset(authUser, dto);
  }

  /**
   * Checks if multiple assets exist on the server and returns all existing - used by background backup
   */
  @Post('/exist')
  @HttpCode(HttpStatus.OK)
  checkExistingAssets(
    @AuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return this.assetService.checkExistingAssets(authUser, dto);
  }

  /**
   * Checks if assets exist by checksums
   */
  @Post('/bulk-upload-check')
  @HttpCode(HttpStatus.OK)
  bulkUploadCheck(
    @AuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: AssetBulkUploadCheckDto,
  ): Promise<AssetBulkUploadCheckResponseDto> {
    return this.assetService.bulkUploadCheck(authUser, dto);
  }
}
