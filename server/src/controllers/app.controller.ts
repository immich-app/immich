import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Authenticated } from 'src/middleware/auth.guard.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { SystemConfigService } from 'src/services/system-config.service.js';

@Controller()
export class AppController {
  constructor(
    private service: SystemConfigService,
    private configRepository: ConfigRepository,
  ) {}

  @ApiExcludeEndpoint()
  @Get('.well-known/immich')
  @Authenticated({ public: true })
  getImmichWellKnown() {
    return {
      api: {
        endpoint: `${this.configRepository.getEnv().basePath}/api`,
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
