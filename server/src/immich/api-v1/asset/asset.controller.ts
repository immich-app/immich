import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Next,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AssetResponseDto } from 'src/domain/asset/response-dto/asset-response.dto';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { AssetService as AssetServiceV1 } from 'src/immich/api-v1/asset/asset.service';
import { AssetBulkUploadCheckDto } from 'src/immich/api-v1/asset/dto/asset-check.dto';
import { AssetSearchDto } from 'src/immich/api-v1/asset/dto/asset-search.dto';
import { CheckExistingAssetsDto } from 'src/immich/api-v1/asset/dto/check-existing-assets.dto';
import { CreateAssetDto } from 'src/immich/api-v1/asset/dto/create-asset.dto';
import { GetAssetThumbnailDto } from 'src/immich/api-v1/asset/dto/get-asset-thumbnail.dto';
import { ServeFileDto } from 'src/immich/api-v1/asset/dto/serve-file.dto';
import { AssetBulkUploadCheckResponseDto } from 'src/immich/api-v1/asset/response-dto/asset-check-response.dto';
import { AssetFileUploadResponseDto } from 'src/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import { CheckExistingAssetsResponseDto } from 'src/immich/api-v1/asset/response-dto/check-existing-assets-response.dto';
import { CuratedLocationsResponseDto } from 'src/immich/api-v1/asset/response-dto/curated-locations-response.dto';
import { CuratedObjectsResponseDto } from 'src/immich/api-v1/asset/response-dto/curated-objects-response.dto';
import { Auth, Authenticated, FileResponse, SharedLinkRoute } from 'src/immich/app.guard';
import { sendFile } from 'src/immich/app.utils';
import {
  FileUploadInterceptor,
  ImmichFile,
  Route,
  mapToUploadFile,
} from 'src/immich/interceptors/file-upload.interceptor';
import { FileNotEmptyValidator, UUIDParamDto } from 'src/validation';

interface UploadFiles {
  assetData: ImmichFile[];
  livePhotoData?: ImmichFile[];
  sidecarData: ImmichFile[];
}

@ApiTags('Asset')
@Controller(Route.ASSET)
@Authenticated()
export class AssetController {
  constructor(private serviceV1: AssetServiceV1) {}

  @SharedLinkRoute()
  @Post('upload')
  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset Upload Information',
    type: CreateAssetDto,
  })
  async uploadFile(
    @Auth() auth: AuthDto,
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator(['assetData'])] })) files: UploadFiles,
    @Body() dto: CreateAssetDto,
    @Res({ passthrough: true }) res: Response,
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

    const responseDto = await this.serviceV1.uploadFile(auth, dto, file, livePhotoFile, sidecarFile);
    if (responseDto.duplicate) {
      res.status(HttpStatus.OK);
    }

    return responseDto;
  }

  @SharedLinkRoute()
  @Get('/file/:id')
  @FileResponse()
  async serveFile(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: ServeFileDto,
  ) {
    await sendFile(res, next, () => this.serviceV1.serveFile(auth, id, dto));
  }

  @SharedLinkRoute()
  @Get('/thumbnail/:id')
  @FileResponse()
  async getAssetThumbnail(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: GetAssetThumbnailDto,
  ) {
    await sendFile(res, next, () => this.serviceV1.serveThumbnail(auth, id, dto));
  }

  @Get('/curated-objects')
  getCuratedObjects(@Auth() auth: AuthDto): Promise<CuratedObjectsResponseDto[]> {
    return this.serviceV1.getCuratedObject(auth);
  }

  @Get('/curated-locations')
  getCuratedLocations(@Auth() auth: AuthDto): Promise<CuratedLocationsResponseDto[]> {
    return this.serviceV1.getCuratedLocation(auth);
  }

  @Get('/search-terms')
  getAssetSearchTerms(@Auth() auth: AuthDto): Promise<string[]> {
    return this.serviceV1.getAssetSearchTerm(auth);
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
  getAllAssets(@Auth() auth: AuthDto, @Query() dto: AssetSearchDto): Promise<AssetResponseDto[]> {
    return this.serviceV1.getAllAssets(auth, dto);
  }

  /**
   * Checks if multiple assets exist on the server and returns all existing - used by background backup
   */
  @Post('/exist')
  @HttpCode(HttpStatus.OK)
  checkExistingAssets(
    @Auth() auth: AuthDto,
    @Body() dto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return this.serviceV1.checkExistingAssets(auth, dto);
  }

  /**
   * Checks if assets exist by checksums
   */
  @Post('/bulk-upload-check')
  @HttpCode(HttpStatus.OK)
  checkBulkUpload(
    @Auth() auth: AuthDto,
    @Body() dto: AssetBulkUploadCheckDto,
  ): Promise<AssetBulkUploadCheckResponseDto> {
    return this.serviceV1.bulkUploadCheck(auth, dto);
  }
}
