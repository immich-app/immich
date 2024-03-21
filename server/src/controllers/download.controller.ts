import { Body, Controller, HttpCode, HttpStatus, Next, Param, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DownloadInfoDto, DownloadResponseDto } from 'src/dtos/download.dto';
import { asStreamableFile, sendFile } from 'src/immich/app.utils';
import { Auth, Authenticated, FileResponse, SharedLinkRoute } from 'src/middleware/auth.guard';
import { DownloadService } from 'src/services/download.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Download')
@Controller('download')
@Authenticated()
export class DownloadController {
  constructor(private service: DownloadService) {}

  @SharedLinkRoute()
  @Post('info')
  getDownloadInfo(@Auth() auth: AuthDto, @Body() dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    return this.service.getDownloadInfo(auth, dto);
  }

  @SharedLinkRoute()
  @Post('archive')
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  downloadArchive(@Auth() auth: AuthDto, @Body() dto: AssetIdsDto): Promise<StreamableFile> {
    return this.service.downloadArchive(auth, dto).then(asStreamableFile);
  }

  @SharedLinkRoute()
  @Post('asset/:id')
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
