import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { EndpointLifecycle } from 'src/decorators';
import {
  AssetBulkUploadCheckResponseDto,
  AssetMediaResponseDto,
  AssetMediaStatus,
  CheckExistingAssetsResponseDto,
} from 'src/dtos/asset-media-response.dto';
import {
  AssetBulkUploadCheckDto,
  AssetMediaCreateDto,
  AssetMediaOptionsDto,
  AssetMediaReplaceDto,
  CheckExistingAssetsDto,
  UploadFieldName,
} from 'src/dtos/asset-media.dto';
import { AuthDto, ImmichHeader } from 'src/dtos/auth.dto';
import { RouteKey } from 'src/enum';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AssetUploadInterceptor } from 'src/middleware/asset-upload.interceptor';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, UploadFiles, getFiles } from 'src/middleware/file-upload.interceptor';
import { AssetMediaService } from 'src/services/asset-media.service';
import { sendFile } from 'src/utils/file';
import { FileNotEmptyValidator, UUIDParamDto } from 'src/validation';

@ApiTags('Assets')
@Controller(RouteKey.ASSET)
export class AssetMediaController {
  constructor(
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    private service: AssetMediaService,
  ) {}

  @Post()
  @UseInterceptors(AssetUploadInterceptor, FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: ImmichHeader.CHECKSUM,
    description: 'sha1 checksum that can be used for duplicate detection before the file is uploaded',
    required: false,
  })
  @ApiBody({ description: 'Asset Upload Information', type: AssetMediaCreateDto })
  @Authenticated({ sharedLink: true })
  async uploadAsset(
    @Auth() auth: AuthDto,
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator(['assetData'])] })) files: UploadFiles,
    @Body() dto: AssetMediaCreateDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AssetMediaResponseDto> {
    const { file, sidecarFile } = getFiles(files);
    const responseDto = await this.service.uploadAsset(auth, dto, file, sidecarFile);

    if (responseDto.status === AssetMediaStatus.DUPLICATE) {
      res.status(HttpStatus.OK);
    }

    return responseDto;
  }

  @Get(':id/original')
  @FileResponse()
  @Authenticated({ sharedLink: true })
  async downloadAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    await sendFile(res, next, () => this.service.downloadOriginal(auth, id), this.logger);
  }

  /**
   *  Replace the asset with new file, without changing its id
   */
  @Put(':id/original')
  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @EndpointLifecycle({ addedAt: 'v1.106.0' })
  @Authenticated({ sharedLink: true })
  async replaceAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @UploadedFiles(new ParseFilePipe({ validators: [new FileNotEmptyValidator([UploadFieldName.ASSET_DATA])] }))
    files: UploadFiles,
    @Body() dto: AssetMediaReplaceDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AssetMediaResponseDto> {
    const { file } = getFiles(files);
    const responseDto = await this.service.replaceAsset(auth, id, dto, file);
    if (responseDto.status === AssetMediaStatus.DUPLICATE) {
      res.status(HttpStatus.OK);
    }
    return responseDto;
  }

  @Get(':id/thumbnail')
  @FileResponse()
  @Authenticated({ sharedLink: true })
  async viewAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: AssetMediaOptionsDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    await sendFile(res, next, () => this.service.viewThumbnail(auth, id, dto), this.logger);
  }

  @Get(':id/video/playback')
  @FileResponse()
  @Authenticated({ sharedLink: true })
  async playAssetVideo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    await sendFile(res, next, () => this.service.playbackVideo(auth, id), this.logger);
  }

  /**
   * Checks if multiple assets exist on the server and returns all existing - used by background backup
   */
  @Post('exist')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  checkExistingAssets(
    @Auth() auth: AuthDto,
    @Body() dto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return this.service.checkExistingAssets(auth, dto);
  }

  /**
   * Checks if assets exist by checksums
   */
  @Post('bulk-upload-check')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  checkBulkUpload(
    @Auth() auth: AuthDto,
    @Body() dto: AssetBulkUploadCheckDto,
  ): Promise<AssetBulkUploadCheckResponseDto> {
    return this.service.bulkUploadCheck(auth, dto);
  }
}
