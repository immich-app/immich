import { Controller, Get } from '@nestjs/common';
import { ServerInfoService } from '@app/common';
import { serverVersion } from '../../constants/server_version.constant';
import { ApiTags } from '@nestjs/swagger';
import { ServerPingResponse } from './response-dto/server-ping-response.dto';
import { ServerVersionReponseDto } from './response-dto/server-version-response.dto';
import { ServerInfoResponseDto } from './response-dto/server-info-response.dto';
import { ServerStatsResponseDto } from './response-dto/server-stats-response.dto';
import { Authenticated } from '../../decorators/authenticated.decorator';

@ApiTags('Server Info')
@Controller('server-info')
export class ServerInfoController {
  constructor(private readonly service: ServerInfoService) {}

  @Get()
  public async getServerInfo(): Promise<ServerInfoResponseDto> {
    return this.service.getServerDiskInfo();
  }

  @Get('/ping')
  public async pingServer(): Promise<ServerPingResponse> {
    return new ServerPingResponse('pong');
  }

  @Get('/version')
  public async getServerVersion(): Promise<ServerVersionReponseDto> {
    return serverVersion;
  }

  @Authenticated({ admin: true })
  @Get('/stats')
  public async getStats(): Promise<ServerStatsResponseDto> {
    return this.service.getServerUsageInfo();
  }
}
