import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { UserConfigDto } from 'src/dtos/config.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemConfigService } from 'src/services/system-config.service';

@ApiTags(ApiTag.ConfigUser)
@Controller('config')
export class ConfigUserController {
  constructor(private service: SystemConfigService) {}

  @Get()
  @Authenticated({ permission: Permission.UserConfigRead })
  @Endpoint({
    summary: 'Get the configuration with user visibility',
    description: 'Retrieve the system configuration properties that are visible to logged in users.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  getUserConfig(): Promise<UserConfigDto> {
    return this.service.getUserConfig();
  }

  @Get('defaults')
  @Authenticated({ permission: Permission.UserConfigRead })
  @Endpoint({
    summary: 'Get the default configuration with user visibility',
    description: 'Retrieve the default value of the configuration properties that are visible to logged in users.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  getUserConfigDefaults(): UserConfigDto {
    return this.service.getUserConfigDefaults();
  }
}
