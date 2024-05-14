import { Body, Controller, HttpCode, HttpStatus, Inject, Next, Param, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DownloadInfoDto, DownloadResponseDto } from 'src/dtos/download.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { DownloadService } from 'src/services/download.service';
import { asStreamableFile, sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Download')
@Controller('download')
export class DownloadController {
  constructor(
    private service: DownloadService,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {}

  @Post('info')
  @Authenticated({ sharedLink: true })
  getDownloadInfo(@Auth() auth: AuthDto, @Body() dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    return this.service.getDownloadInfo(auth, dto);
  }

  @Post('archive')
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  @Authenticated({ sharedLink: true })
  downloadArchive(@Auth() auth: AuthDto, @Body() dto: AssetIdsDto): Promise<StreamableFile> {
    return this.service.downloadArchive(auth, dto).then(asStreamableFile);
  }

  @Post('asset/:id')
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  @Authenticated({ sharedLink: true })
  async downloadFile(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
  ) {
    await sendFile(res, next, () => this.service.downloadFile(auth, id), this.logger);
  }
}
