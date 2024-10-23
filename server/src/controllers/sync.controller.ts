import { Body, Controller, Header, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetDeltaSyncDto,
  AssetDeltaSyncResponseDto,
  AssetFullSyncDto,
  SyncAcknowledgeDto,
  SyncStreamDto,
  SyncStreamResponseDto,
} from 'src/dtos/sync.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { SyncService } from 'src/services/sync.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(
    private syncService: SyncService,
    private errorService: GlobalExceptionFilter,
  ) {}

  @Post('acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  ackSync(@Auth() auth: AuthDto, @Body() dto: SyncAcknowledgeDto) {
    return this.syncService.acknowledge(auth, dto);
  }

  @Post('stream')
  @Header('Content-Type', 'application/jsonlines+json')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, type: SyncStreamResponseDto, isArray: true })
  @Authenticated()
  getSyncStream(@Auth() auth: AuthDto, @Res() res: Response, @Body() dto: SyncStreamDto) {
    try {
      void this.syncService.stream(auth, res, dto);
    } catch (error: Error | any) {
      res.setHeader('Content-Type', 'application/json');
      this.errorService.handleError(res, error);
    }
  }

  @Post('full-sync')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  getFullSyncForUser(@Auth() auth: AuthDto, @Body() dto: AssetFullSyncDto): Promise<AssetResponseDto[]> {
    return this.syncService.getFullSync(auth, dto);
  }

  @Post('delta-sync')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  getDeltaSync(@Auth() auth: AuthDto, @Body() dto: AssetDeltaSyncDto): Promise<AssetDeltaSyncResponseDto> {
    return this.syncService.getDeltaSync(auth, dto);
  }
}
