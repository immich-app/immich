import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { ServerInfoService } from './server-info.service';
import { serverVersion } from '../../constants/server_version.constant';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('server-info')
export class ServerInfoController {
  constructor(private readonly serverInfoService: ServerInfoService, private readonly configService: ConfigService) {}

  @Get()
  async getServerInfo() {
    return await this.serverInfoService.getServerInfo();
  }

  @Get('/ping')
  async getServerPulse() {
    return {
      res: 'pong',
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('/mapbox')
  async getMapboxInfo() {
    return {
      isEnable: this.configService.get('ENABLE_MAPBOX'),
      mapboxSecret: this.configService.get('MAPBOX_KEY'),
    };
  }

  @Get('/version')
  async getServerVersion() {
    return serverVersion;
  }
}
