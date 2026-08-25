import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemConfigService } from 'src/services/system-config.service';

@Controller()
export class AppController {
  constructor(private service: SystemConfigService) {}

  @ApiExcludeEndpoint()
  @Get('.well-known/immich')
  @Authenticated({ public: true })
  getImmichWellKnown() {
    return {
      api: {
        endpoint: '/api',
      },
    };
  }

  @ApiExcludeEndpoint()
  @Get('custom.css')
  @Authenticated({ public: true })
  @Header('Content-Type', 'text/css')
  getCustomCss() {
    return this.service.getCustomCss();
  }
}
