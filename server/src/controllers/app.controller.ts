import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  @ApiExcludeEndpoint()
  @Get('.well-known/immich')
  getImmichWellKnown() {
    return { api: { endpoint: '/api' } };
  }

  @ApiExcludeEndpoint()
  @Get('custom.css')
  @Header('Content-Type', 'text/css')
  getCustomCss() {
    return '';
  }
}
