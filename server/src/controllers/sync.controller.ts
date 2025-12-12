import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetDeltaSyncDto,
  AssetDeltaSyncResponseDto,
  AssetFullSyncDto,
  SyncAckDeleteDto,
  SyncAckDto,
  SyncAckSetDto,
  SyncStreamDto,
} from 'src/dtos/sync.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { SyncService } from 'src/services/sync.service';

@ApiTags(ApiTag.Sync)
@Controller('sync')
export class SyncController {
  constructor(
    private service: SyncService,
    private errorService: GlobalExceptionFilter,
  ) {}

  @Post('full-sync')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Get full sync for user',
    description: 'Retrieve all assets for a full synchronization for the authenticated user.',
    history: new HistoryBuilder().added('v1').deprecated('v2'),
  })
  getFullSyncForUser(@Auth() auth: AuthDto, @Body() dto: AssetFullSyncDto): Promise<AssetResponseDto[]> {
    return this.service.getFullSync(auth, dto);
  }

  @Post('delta-sync')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Get delta sync for user',
    description: 'Retrieve changed assets since the last sync for the authenticated user.',
    history: new HistoryBuilder().added('v1').deprecated('v2'),
  })
  getDeltaSync(@Auth() auth: AuthDto, @Body() dto: AssetDeltaSyncDto): Promise<AssetDeltaSyncResponseDto> {
    return this.service.getDeltaSync(auth, dto);
  }

  @Post('stream')
  @Authenticated({ permission: Permission.SyncStream })
  @Header('Content-Type', 'application/jsonlines+json')
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Stream sync changes',
    description:
      'Retrieve a JSON lines streamed response of changes for synchronization. This endpoint is used by the mobile app to efficiently stay up to date with changes.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async getSyncStream(@Auth() auth: AuthDto, @Res() res: Response, @Body() dto: SyncStreamDto) {
    try {
      await this.service.stream(auth, res, dto);
    } catch (error: Error | any) {
      res.setHeader('Content-Type', 'application/json');
      this.errorService.handleError(res, error);
    }
  }

  @Get('ack')
  @Authenticated({ permission: Permission.SyncCheckpointRead })
  @Endpoint({
    summary: 'Retrieve acknowledgements',
    description: 'Retrieve the synchronization acknowledgments for the current session.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getSyncAck(@Auth() auth: AuthDto): Promise<SyncAckDto[]> {
    return this.service.getAcks(auth);
  }

  @Post('ack')
  @Authenticated({ permission: Permission.SyncCheckpointUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Acknowledge changes',
    description:
      'Send a list of synchronization acknowledgements to confirm that the latest changes have been received.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  sendSyncAck(@Auth() auth: AuthDto, @Body() dto: SyncAckSetDto) {
    return this.service.setAcks(auth, dto);
  }

  @Delete('ack')
  @Authenticated({ permission: Permission.SyncCheckpointDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete acknowledgements',
    description: 'Delete specific synchronization acknowledgments.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteSyncAck(@Auth() auth: AuthDto, @Body() dto: SyncAckDeleteDto): Promise<void> {
    return this.service.deleteAcks(auth, dto);
  }
}
