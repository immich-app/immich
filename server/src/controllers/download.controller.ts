import { Body, Controller, HttpCode, HttpStatus, Next, Param, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { DownloadInfoDto, DownloadResponseDto } from 'src/dtos/download.dto';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { DownloadService } from 'src/services/download.service';
import { asStreamableFile, sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Download')
@Controller('download')
export class DownloadController {
  constructor(private service: DownloadService) {}

  @Post('info')
  @Authenticated(Permission.ASSET_READ, { sharedLink: true })
  getDownloadInfo(@Auth() auth: AuthDto, @Body() dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    return this.service.getDownloadInfo(auth, dto);
  }

  @Post('archive')
  @Authenticated(Permission.ASSET_DOWNLOAD, { sharedLink: true })
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  downloadArchive(@Auth() auth: AuthDto, @Body() dto: AssetIdsDto): Promise<StreamableFile> {
    return this.service.downloadArchive(auth, dto).then(asStreamableFile);
  }

  @Post('asset/:id')
  @Authenticated(Permission.ASSET_DOWNLOAD, { sharedLink: true })
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  async downloadFile(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
  ) {
    await sendFile(res, next, () => this.service.downloadFile(auth, id));
  }
}
