import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServerInfoService } from './server-info.service';

@Controller('server-info')
export class ServerInfoController {
  constructor(private readonly serverInfoService: ServerInfoService) {}

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
}
