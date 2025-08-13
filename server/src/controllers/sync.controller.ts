import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
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
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { SyncService } from 'src/services/sync.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(
    private service: SyncService,
    private errorService: GlobalExceptionFilter,
  ) {}

  @Post('full-sync')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  getFullSyncForUser(@Auth() auth: AuthDto, @Body() dto: AssetFullSyncDto): Promise<AssetResponseDto[]> {
    return this.service.getFullSync(auth, dto);
  }

  @Post('delta-sync')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  getDeltaSync(@Auth() auth: AuthDto, @Body() dto: AssetDeltaSyncDto): Promise<AssetDeltaSyncResponseDto> {
    return this.service.getDeltaSync(auth, dto);
  }

  @Post('stream')
  @Authenticated({ permission: Permission.SyncStream })
  @Header('Content-Type', 'application/jsonlines+json')
  @HttpCode(HttpStatus.OK)
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
  getSyncAck(@Auth() auth: AuthDto): Promise<SyncAckDto[]> {
    return this.service.getAcks(auth);
  }

  @Post('ack')
  @Authenticated({ permission: Permission.SyncCheckpointUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  sendSyncAck(@Auth() auth: AuthDto, @Body() dto: SyncAckSetDto) {
    return this.service.setAcks(auth, dto);
  }

  @Delete('ack')
  @Authenticated({ permission: Permission.SyncCheckpointDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSyncAck(@Auth() auth: AuthDto, @Body() dto: SyncAckDeleteDto): Promise<void> {
    return this.service.deleteAcks(auth, dto);
  }
}
