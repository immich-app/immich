import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AdminConfigDto } from 'src/dtos/config.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemConfigService } from 'src/services/system-config.service';

@ApiTags(ApiTag.ConfigAdmin)
@Controller('admin/config')
export class ConfigAdminController {
  constructor(private service: SystemConfigService) {}

  @Get()
  @Authenticated({ permission: Permission.AdminConfigRead, admin: true })
  @Endpoint({
    summary: 'Get the admin configuration',
    description: 'Retrieve admin configuration.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  getAdminConfig(): Promise<AdminConfigDto> {
    return this.service.getAdminConfig();
  }

  @Get('defaults')
  @Authenticated({ permission: Permission.AdminConfigRead, admin: true })
  @Endpoint({
    summary: 'Get the system configuration defaults',
    description: 'Retrieve the default value of every system configuration property.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  getAdminConfigDefaults(): AdminConfigDto {
    return this.service.getAdminConfigDefaults();
  }

  @Put()
  @Authenticated({ permission: Permission.AdminConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Update the system configuration',
    description: 'Update the system configuration with a new system configuration.',
    history: new HistoryBuilder().added('v3.2.0').alpha('v3.2.0'),
  })
  updateAdminConfig(@Body() dto: AdminConfigDto): Promise<AdminConfigDto> {
    return this.service.updateAdminConfig(dto);
  }
}
