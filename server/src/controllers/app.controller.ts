import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Authenticated } from 'src/middleware/auth.guard.js';
import { PasskeyService } from 'src/services/passkey.service.js';
import { SystemConfigService } from 'src/services/system-config.service.js';

@Controller()
export class AppController {
  constructor(
    private service: SystemConfigService,
    private passkeyService: PasskeyService,
  ) {}

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
  @Get('.well-known/webauthn')
  @Authenticated({ public: true })
  getWebAuthnWellKnown() {
    return this.passkeyService.getWellKnown();
  }

  @ApiExcludeEndpoint()
  @Get('custom.css')
  @Authenticated({ public: true })
  @Header('Content-Type', 'text/css')
  getCustomCss() {
    return this.service.getCustomCss();
  }
}
