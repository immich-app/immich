import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetDeltaSyncDto, AssetDeltaSyncResponseDto, AssetFullSyncDto } from 'src/dtos/sync.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SyncService } from 'src/services/sync.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private service: SyncService) {}

  @Post('full-sync')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  getFullSyncForUser(@Auth() auth: AuthDto, @Body() dto: AssetFullSyncDto): Promise<AssetResponseDto[]> {
    return this.service.getFullSync(auth, dto);
  }

  @Post('delta-sync')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  getDeltaSync(@Auth() auth: AuthDto, @Body() dto: AssetDeltaSyncDto): Promise<AssetDeltaSyncResponseDto> {
    return this.service.getDeltaSync(auth, dto);
  }
}
