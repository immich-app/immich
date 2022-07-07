import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { ServerInfoService } from './server-info.service';
import { serverVersion } from '../../constants/server_version.constant';
import { ApiTags } from '@nestjs/swagger';
import { ServerInfoDto } from './dto/server-info.dto';
import { ServerPingResponse } from './response-dto/server-ping-response.dto';
import { ServerVersionReponseDto } from './response-dto/server-version-response.dto';

@ApiTags('Server Info')
@Controller('server-info')
export class ServerInfoController {
  constructor(private readonly serverInfoService: ServerInfoService, private readonly configService: ConfigService) {}

  @Get()
  async getServerInfo(): Promise<ServerInfoDto> {
    return await this.serverInfoService.getServerInfo();
  }

  @Get('/ping')
  async getServerPulse(): Promise<ServerPingResponse> {
    return new ServerPingResponse('pong');
  }

  @Get('/version')
  async getServerVersion(): Promise<ServerVersionReponseDto> {
    return serverVersion;
  }
}
