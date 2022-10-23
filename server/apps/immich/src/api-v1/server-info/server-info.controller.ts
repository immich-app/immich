import { Controller, Get } from '@nestjs/common';
import { ServerInfoService } from './server-info.service';
import { serverVersion } from '../../constants/server_version.constant';
import { ApiTags } from '@nestjs/swagger';
import { ServerPingResponse } from './response-dto/server-ping-response.dto';
import { ServerVersionReponseDto } from './response-dto/server-version-response.dto';
import { ServerInfoResponseDto } from './response-dto/server-info-response.dto';
import { ServerStatsResponseDto } from './response-dto/server-stats-response.dto';

@ApiTags('Server Info')
@Controller('server-info')
export class ServerInfoController {
  constructor(private readonly serverInfoService: ServerInfoService) {}

  @Get()
  async getServerInfo(): Promise<ServerInfoResponseDto> {
    return await this.serverInfoService.getServerInfo();
  }

  @Get('/ping')
  async pingServer(): Promise<ServerPingResponse> {
    return new ServerPingResponse('pong');
  }

  @Get('/version')
  async getServerVersion(): Promise<ServerVersionReponseDto> {
    return serverVersion;
  }

  @Get('/stats')
  async getStats(): Promise<ServerStatsResponseDto> {
    return await this.serverInfoService.getStats();
  }
}
