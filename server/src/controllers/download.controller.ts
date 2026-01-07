import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DownloadInfoDto, DownloadResponseDto, PrepareDownloadResponseDto } from 'src/dtos/download.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { DownloadService } from 'src/services/download.service';
import { asStreamableFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Download)
@Controller('download')
export class DownloadController {
  constructor(private service: DownloadService) {}

  @Post('info')
  @Authenticated({ permission: Permission.AssetDownload, sharedLink: true })
  @Endpoint({
    summary: 'Retrieve download information',
    description:
      'Retrieve information about how to request a download for the specified assets or album. The response includes groups of assets that can be downloaded together.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getDownloadInfo(@Auth() auth: AuthDto, @Body() dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    return this.service.getDownloadInfo(auth, dto);
  }

  @Post('request')
  @Authenticated({ permission: Permission.AssetDownload, sharedLink: true })
  @Endpoint({
    summary: 'Prepare download archive',
    description:
      'Create a download request for the specified assets or album. The response includes one or more tokens that can be used to download groups of assets.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  prepareDownload(@Auth() auth: AuthDto, @Body() dto: DownloadInfoDto): Promise<PrepareDownloadResponseDto> {
    return this.service.prepareDownload(auth, dto);
  }

  @Post('archive')
  @Authenticated({ permission: Permission.AssetDownload, sharedLink: true })
  @FileResponse()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Download asset archive',
    description:
      'Download a ZIP archive containing the specified assets. The assets must have been previously requested via the "getDownloadInfo" endpoint.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  downloadArchive(@Auth() auth: AuthDto, @Body() dto: AssetIdsDto): Promise<StreamableFile> {
    return this.service.downloadArchive(auth, dto).then(asStreamableFile);
  }

  @Get('archive/:id')
  @Authenticated({ permission: Permission.AssetDownload, sharedLink: true })
  @FileResponse()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Download asset archive from download request',
    description:
      'Download a ZIP archive corresponding to the given download request. The download request needs to be created first.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  downloadRequestArchive(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<StreamableFile> {
    return this.service.downloadRequestArchive(auth, id).then(asStreamableFile);
  }
}
