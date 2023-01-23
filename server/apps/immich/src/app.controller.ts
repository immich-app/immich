import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { SystemConfigService } from '@app/domain';

@Controller()
export class AppController {
  constructor(private configService: SystemConfigService) {}

  @ApiExcludeEndpoint()
  @Post('refresh-config')
  @HttpCode(HttpStatus.OK)
  public reloadConfig() {
    return this.configService.refreshConfig();
  }
}
