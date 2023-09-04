import {
  ServerFeaturesDto,
  ServerInfoResponseDto,
  ServerInfoService,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  ServerVersionResponseDto,
} from '@app/domain';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRoute, Authenticated, PublicRoute } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Server Info')
@Controller('server-info')
@Authenticated()
@UseValidation()
export class ServerInfoController {
  constructor(private service: ServerInfoService) {}

  @Get()
  getServerInfo(): Promise<ServerInfoResponseDto> {
    return this.service.getInfo();
  }

  @PublicRoute()
  @Get('ping')
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @PublicRoute()
  @Get('version')
  getServerVersion(): ServerVersionResponseDto {
    return this.service.getVersion();
  }

  @PublicRoute()
  @Get('features')
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @AdminRoute()
  @Get('stats')
  getStats(): Promise<ServerStatsResponseDto> {
    return this.service.getStats();
  }

  @PublicRoute()
  @Get('media-types')
  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return this.service.getSupportedMediaTypes();
  }
}
