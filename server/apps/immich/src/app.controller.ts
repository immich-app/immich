import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ImmichConfigService } from '@app/immich-config';

@Controller()
export class AppController {
  constructor(private configService: ImmichConfigService) {}

  @ApiExcludeEndpoint()
  @Post('refresh-config')
  @HttpCode(HttpStatus.OK)
  public reloadConfig() {
    return this.configService.refreshConfig();
  }
}
