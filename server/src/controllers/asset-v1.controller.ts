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
  Put,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import {
  AssetBulkUploadCheckResponseDto,
  AssetFileUploadResponseDto,
  CheckExistingAssetsResponseDto,
  CuratedLocationsResponseDto,
  CuratedObjectsResponseDto,
} from 'src/dtos/asset-v1-response.dto';
import {
  AssetBulkUploadCheckDto,
  AssetSearchDto,
  CheckExistingAssetsDto,
  CreateAssetDto,
  GetAssetThumbnailDto,
  ServeFileDto,
  UpdateAssetDataDto,
} from 'src/dtos/asset-v1.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated, FileResponse, SharedLinkRoute } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, ImmichFile, Route, mapToUploadFile } from 'src/middleware/file-upload.interceptor';
import { AssetServiceV1 } from 'src/services/asset-v1.service';
import { UploadFile } from 'src/services/asset.service';
import { sendFile } from 'src/utils/file';
import { FileNotEmptyValidator, UUIDParamDto } from 'src/validation';

interface UploadFiles {
  assetData: ImmichFile[];
  livePhotoData?: ImmichFile[];
  sidecarData: ImmichFile[];
}

function getFile(files: UploadFiles, property: 'assetData' | 'livePhotoData' | 'sidecarData') {
  const file = files[property]?.[0];
  return file ? mapToUploadFile(file) : file;
}

function getFiles(files: UploadFiles) {
  return {
    file: getFile(files, 'assetData') as UploadFile,
    livePhotoFile: getFile(files, 'livePhotoData'),
    sidecarFile: getFile(files, 'sidecarData'),
  };
}

@ApiTags('Asset')
@Controller(Route.ASSET)
@Authenticated()
export class AssetControllerV1 {
  constructor(private service: AssetServiceV1) {}

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
    const { file, livePhotoFile, sidecarFile } = getFiles(files);
    const responseDto = await this.service.uploadFile(auth, dto, file, livePhotoFile, sidecarFile);
    if (responseDto.duplicate) {
      res.status(HttpStatus.OK);
    }
    return responseDto;
  }

  @SharedLinkRoute()
  @Put(':id/upload')
  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset Upload Information',
    type: UpdateAssetDataDto,
  })
  async updateFile(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator(['assetData'])] })) files: UploadFiles,
    @Body() dto: UpdateAssetDataDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AssetFileUploadResponseDto> {
    const { file, livePhotoFile, sidecarFile } = getFiles(files);
    const responseDto = await this.service.updateFile(auth, dto, id, file, livePhotoFile, sidecarFile);
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
    await sendFile(res, next, () => this.service.serveFile(auth, id, dto));
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
    await sendFile(res, next, () => this.service.serveThumbnail(auth, id, dto));
  }

  @Get('/curated-objects')
  getCuratedObjects(@Auth() auth: AuthDto): Promise<CuratedObjectsResponseDto[]> {
    return this.service.getCuratedObject(auth);
  }

  @Get('/curated-locations')
  getCuratedLocations(@Auth() auth: AuthDto): Promise<CuratedLocationsResponseDto[]> {
    return this.service.getCuratedLocation(auth);
  }

  @Get('/search-terms')
  getAssetSearchTerms(@Auth() auth: AuthDto): Promise<string[]> {
    return this.service.getAssetSearchTerm(auth);
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
    return this.service.getAllAssets(auth, dto);
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
    return this.service.checkExistingAssets(auth, dto);
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
    return this.service.bulkUploadCheck(auth, dto);
  }
}
