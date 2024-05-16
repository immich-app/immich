import {
  Body,
  Controller,
  Get,
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
import { EndpointLifecycle } from 'src/decorators';
import { GetAssetThumbnailDto } from 'src/dtos/asset-media-response.dto';
import { ServeFileDto } from 'src/dtos/asset-media.dto';
import { AssetFileUploadResponseDto } from 'src/dtos/asset-v1-response.dto';
import { CreateAssetDto } from 'src/dtos/asset-v1.dto';
import { AuthDto, ImmichHeader } from 'src/dtos/auth.dto';
import { AssetUploadInterceptor } from 'src/middleware/asset-upload.interceptor';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, Route, UploadFiles, getFiles } from 'src/middleware/file-upload.interceptor';
import { AssetMediaService } from 'src/services/asset-media.service';
import { AssetServiceV1 } from 'src/services/asset-v1.service';
import { sendFile } from 'src/utils/file';
import { FileNotEmptyValidator, UUIDParamDto } from 'src/validation';

/**
 * This entire class holds deprecated routes for backwards compat with older mobile clients
 * Delete this file this after a few releases
 * @deprecated
 */
@ApiTags('Asset')
@Controller(Route.ASSET)
export class AssetControllerV1 {
  constructor(
    private service: AssetServiceV1,
    private assetMediaService: AssetMediaService,
  ) {}

  /** @deprecated  - renamed to POST /api/asset */
  @Post('upload')
  @UseInterceptors(AssetUploadInterceptor, FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: ImmichHeader.CHECKSUM,
    description: 'sha1 checksum that can be used for duplicate detection before the file is uploaded',
    required: false,
  })
  @ApiBody({ description: 'Asset Upload Information', type: CreateAssetDto })
  @Authenticated({ sharedLink: true })
  @EndpointLifecycle({ deprecatedAt: 'v1.106.0' })
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

  /** @deprecated - renamed to GET /api/asset/:id/thumbnail */
  @Get('thumbnail/:id')
  @FileResponse()
  @Authenticated({ sharedLink: true })
  @EndpointLifecycle({ deprecatedAt: 'v1.106.0' })
  async getAssetThumbnail(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: GetAssetThumbnailDto,
  ) {
    await sendFile(res, next, () => this.assetMediaService.getThumbnailBytes(auth, id, dto));
  }

  /** @deprecated  - renamed to GET /api/asset/:id/file */
  @Get('file/:id')
  @FileResponse()
  @Authenticated({ sharedLink: true })
  @EndpointLifecycle({ deprecatedAt: 'v1.106.0' })
  async serveFile(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: ServeFileDto,
  ) {
    await sendFile(res, next, () => this.assetMediaService.getOriginalBytes(auth, id, dto));
  }
}
