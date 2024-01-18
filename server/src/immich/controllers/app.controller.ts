import { SystemConfigService } from '@app/domain';
import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { PublicRoute } from '../app.guard';

@Controller()
export class AppController {
  constructor(private service: SystemConfigService) {}

  @ApiExcludeEndpoint()
  @Get('.well-known/immich')
  getImmichWellKnown() {
    return {
      api: {
        endpoint: '/api',
      },
    };
  }

  @ApiExcludeEndpoint()
  @PublicRoute()
  @Get('custom.css')
  @Header('Content-Type', 'text/css')
  getCustomCss() {
    return this.service.getCustomCss();
  }
}
