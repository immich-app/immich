import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import e from 'express';
import { PublicRoute } from 'src/middleware/auth.guard';
import { SystemConfigService } from 'src/services/system-config.service';

@Controller()
export class AppController {
  constructor(private service: SystemConfigService) {}

  @ApiExcludeEndpoint()
  @Get('.well-known/immich')
  getImmichWellKnown() {
    return this.service.getConfig().then((config) => {
      return {
        api: {
          endpoint: '/api',
        },
        upload: {
          domain: config.server.uploadDomain,
        },
      };
    });
  }

  @ApiExcludeEndpoint()
  @PublicRoute()
  @Get('custom.css')
  @Header('Content-Type', 'text/css')
  getCustomCss() {
    return this.service.getCustomCss();
  }
}
