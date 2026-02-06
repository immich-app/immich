import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  ServerAboutResponseDto,
  ServerConfigDto,
  ServerFeaturesDto,
  ServerPingResponse,
  ServerVersionResponseDto,
} from 'src/dtos/server.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { ServerService } from 'src/services/server.service';

@ApiTags(ApiTag.Server)
@Controller('server')
export class ServerController {
  constructor(private service: ServerService) {}

  @Get('about')
  @Authenticated({ permission: Permission.ServerAbout })
  @Endpoint({
    summary: 'Get server information',
    description: 'Retrieve a list of information about the server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAboutInfo(): Promise<ServerAboutResponseDto> {
    return this.service.getAboutInfo();
  }

  @Get('ping')
  @Endpoint({
    summary: 'Ping',
    description: 'Pong',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('version')
  @Endpoint({
    summary: 'Get server version',
    description: 'Retrieve the current server version in semantic versioning (semver) format.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerVersion(): ServerVersionResponseDto {
    return this.service.getVersion();
  }

  @Get('features')
  @Endpoint({
    summary: 'Get features',
    description: 'Retrieve available features supported by this server.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerFeatures(): Promise<ServerFeaturesDto> {
    return this.service.getFeatures();
  }

  @Get('config')
  @Endpoint({
    summary: 'Get config',
    description: 'Retrieve the current server configuration.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getSystemConfig();
  }
}
