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
import {
  AssetBulkUploadCheckResponseDto,
  AssetMediaUploadResponseDto,
  CheckExistingAssetsResponseDto,
  GetAssetThumbnailDto,
} from 'src/dtos/asset-media-response.dto';
import {
  AssetBulkUploadCheckDto,
  CheckExistingAssetsDto,
  CreateAssetMediaDto,
  ServeFileDto,
  UpdateAssetMediaDto,
  UploadFieldName,
} from 'src/dtos/asset-media.dto';

import { AuthDto, ImmichHeader } from 'src/dtos/auth.dto';
import { AssetUploadInterceptor } from 'src/middleware/asset-upload.interceptor';
import { Auth, Authenticated, FileResponse, SharedLinkRoute } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, Route, UploadFiles, getFiles } from 'src/middleware/file-upload.interceptor';
import { AssetMediaService } from 'src/services/asset-media.service';

import { sendFile } from 'src/utils/file';
import { FileNotEmptyValidator, UUIDParamDto } from 'src/validation';

@ApiTags('Asset')
@Controller(Route.ASSET)
@Authenticated()
export class AssetMediaController {
  constructor(private service: AssetMediaService) {}

  /**
   * POST /api/asset
   */
  @SharedLinkRoute()
  @Post()
  @UseInterceptors(AssetUploadInterceptor, FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: ImmichHeader.CHECKSUM,
    description: 'sha1 checksum that can be used for duplicate detection before the file is uploaded',
    required: false,
  })
  @ApiBody({
    description: 'Asset Upload Information',
    type: CreateAssetMediaDto,
  })
  async createAssetMedia(
    @Auth() auth: AuthDto,
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator(['assetData'])] })) files: UploadFiles,
    @Body() dto: CreateAssetMediaDto,
  ): Promise<AssetMediaUploadResponseDto> {
    const { file, sidecarFile } = getFiles(files);
    return await this.service.uploadFile(auth, dto, file, sidecarFile);
  }

  /**
   * GET /api/asset/:id/file
   */
  @SharedLinkRoute()
  @Get('/:id/file')
  @FileResponse()
  async getAsssetMedia(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: ServeFileDto,
  ) {
    await sendFile(res, next, () => this.service.serveFile(auth, id, dto));
  }

  /**
   * PUT /api/asset/:id/file
   */
  @SharedLinkRoute()
  @Put(':id/file')
  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset Upload Information',
    type: UpdateAssetMediaDto,
  })
  async updateAssetMedia(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator([UploadFieldName.ASSET_DATA])] }))
    files: UploadFiles,
    @Body() dto: UpdateAssetMediaDto,
  ): Promise<AssetMediaUploadResponseDto> {
    const { file } = getFiles(files);
    const responseDto = await this.service.updateFile(auth, id, dto, file);
    return responseDto;
  }

  /**
   * GET /api/asset/:id/thumbnail
   */
  @SharedLinkRoute()
  @Get('/:id/thumbnail')
  @FileResponse()
  async getAssetMediaThumbnail(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: GetAssetThumbnailDto,
  ) {
    await sendFile(res, next, () => this.service.serveThumbnail(auth, id, dto));
  }

  /**
   * POST /api/asset/exist
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
   * POST /api/asset/bulk-upload-check
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
