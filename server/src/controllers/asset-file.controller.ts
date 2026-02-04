import { Controller, Delete, Get, HttpCode, HttpStatus, Next, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetFileResponseDto, AssetFileSearchDto } from 'src/dtos/asset-file.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AssetFileService } from 'src/services/asset-file.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.AssetFiles)
@Controller('asset-files')
export class AssetFilesController {
  constructor(
    private service: AssetFileService,
    private logger: LoggingRepository,
  ) {}

  @Get()
  @Authenticated({ permission: Permission.AssetFileRead })
  @Endpoint({
    summary: 'Retrieve an asset file',
    description: 'Returns a metadata about a specific asset file.',
    history: new HistoryBuilder().added('v2.6.0').beta('v2.6.0'),
  })
  searchAssetFiles(@Auth() auth: AuthDto, @Query() dto: AssetFileSearchDto): Promise<AssetFileResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AssetFileRead })
  @Endpoint({
    summary: 'Retrieve an asset file',
    description: 'Returns a metadata about a specific asset file.',
    history: new HistoryBuilder().added('v2.6.0').beta('v2.6.0'),
  })
  getAssetFile(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetFileResponseDto> {
    return this.service.get(auth, id);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.AssetFileDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete an asset file',
    description: 'Delete a file and remove it from the database.',
    history: new HistoryBuilder().added('v2.6.0').beta('v2.6.0'),
  })
  deleteAssetFile(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/download')
  @FileResponse()
  @Authenticated({ permission: Permission.AssetFileDownload })
  @Endpoint({
    summary: 'Download an asset file',
    description: 'Serve the contents of a specific asset file.',
    history: new HistoryBuilder().added('v2.6.0').beta('v2.6.0'),
  })
  async downloadAssetFile(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    await sendFile(res, next, () => this.service.download(auth, id), this.logger);
  }
}
