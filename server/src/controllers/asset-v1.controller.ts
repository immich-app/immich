import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
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
import { AssetFileUploadResponseDto } from 'src/dtos/asset-v1-response.dto';
import { CreateAssetDto, GetAssetThumbnailDto, ServeFileDto } from 'src/dtos/asset-v1.dto';
import { AuthDto, ImmichHeader } from 'src/dtos/auth.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AssetUploadInterceptor } from 'src/middleware/asset-upload.interceptor';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, Route, UploadFiles, mapToUploadFile } from 'src/middleware/file-upload.interceptor';
import { AssetServiceV1 } from 'src/services/asset-v1.service';
import { sendFile } from 'src/utils/file';
import { FileNotEmptyValidator, UUIDParamDto } from 'src/validation';

@ApiTags('Asset')
@Controller(Route.ASSET)
export class AssetControllerV1 {
  constructor(
    private service: AssetServiceV1,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {}

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

    const responseDto = await this.service.uploadFile(auth, dto, file, livePhotoFile, sidecarFile);
    if (responseDto.duplicate) {
      res.status(HttpStatus.OK);
    }

    return responseDto;
  }

  @Get('/file/:id')
  @FileResponse()
  @Authenticated({ sharedLink: true })
  async serveFile(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: ServeFileDto,
  ) {
    await sendFile(res, next, () => this.service.serveFile(auth, id, dto), this.logger);
  }

  @Get('/thumbnail/:id')
  @FileResponse()
  @Authenticated({ sharedLink: true })
  async getAssetThumbnail(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: GetAssetThumbnailDto,
  ) {
    await sendFile(res, next, () => this.service.serveThumbnail(auth, id, dto), this.logger);
  }
}
