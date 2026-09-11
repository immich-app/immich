import { Controller, Delete, Get, HttpCode, HttpStatus, Next, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { AssetFileResponseDto, AssetFileSearchDto } from 'src/dtos/asset-file.dto.js';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { AssetFileService } from 'src/services/asset-file.service.js';
import { sendFile } from 'src/utils/file.js';
import { UUIDParamDto } from 'src/validation.js';

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
    summary: 'Search asset files',
    description: 'Returns all matching asset files.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  searchAssetFiles(@Auth() auth: AuthDto, @Query() dto: AssetFileSearchDto): Promise<AssetFileResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AssetFileRead })
  @Endpoint({
    summary: 'Retrieve an asset file',
    description: 'Returns metadata about a specific asset file.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
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
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
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
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
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
