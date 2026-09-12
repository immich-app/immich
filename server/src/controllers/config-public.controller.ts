import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { PublicConfigDto } from 'src/dtos/config.dto.js';
import { ApiTag } from 'src/enum.js';
import { Authenticated } from 'src/middleware/auth.guard.js';
import { SystemConfigService } from 'src/services/system-config.service.js';

@ApiTags(ApiTag.ConfigPublic)
@Controller('public/config')
export class ConfigPublicController {
  constructor(private service: SystemConfigService) {}

  @Get()
  @Authenticated({ public: true })
  @Endpoint({
    summary: 'Get the public configuration',
    description: 'Retrieve the system configuration properties that are visible to everyone.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  getPublicConfig(): Promise<PublicConfigDto> {
    return this.service.getPublicConfig();
  }

  @Get('defaults')
  @Authenticated({ public: true })
  @Endpoint({
    summary: 'Get the public configuration defaults',
    description: 'Retrieve the default value of the configuration properties that are visible to everyone.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  getPublicConfigDefaults(): PublicConfigDto {
    return this.service.getPublicConfigDefaults();
  }
}
