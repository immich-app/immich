import { Body, Controller, HttpCode, HttpStatus, Post, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DownloadInfoDto, DownloadResponseDto } from 'src/dtos/download.dto';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { DownloadService } from 'src/services/download.service';
import { asStreamableFile } from 'src/utils/file';

@ApiTags('Download')
@Controller('download')
export class DownloadController {
  constructor(private service: DownloadService) {}

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
}
