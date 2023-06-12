import {
  ServerInfoResponseDto,
  ServerInfoService,
  ServerPingResponse,
  ServerStatsResponseDto,
  ServerVersionReponseDto,
} from '@app/domain';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRoute, Authenticated, PublicRoute } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

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
  @Get('/ping')
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @PublicRoute()
  @Get('/version')
  getServerVersion(): ServerVersionReponseDto {
    return this.service.getVersion();
  }

  @AdminRoute()
  @Get('/stats')
  getStats(): Promise<ServerStatsResponseDto> {
    return this.service.getStats();
  }
}
