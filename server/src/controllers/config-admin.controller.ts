import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { AdminConfigDto, AdminConfigFieldDto } from 'src/dtos/config.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Authenticated } from 'src/middleware/auth.guard.js';
import { SystemConfigService } from 'src/services/system-config.service.js';

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

  @Get('fields')
  @Authenticated({ permission: Permission.AdminConfigRead, admin: true })
  @Endpoint({
    summary: 'Get the fields information for admin config',
    description:
      'Retrieve, for every configuration property, the effective value, the default value, where the value came from (default, database, config file, or environment variable), and whether it can be changed via the API.',
    history: new HistoryBuilder().added('v3.3.0').alpha('v3.3.0'),
  })
  getAdminConfigFields(): Promise<AdminConfigFieldDto[]> {
    return this.service.getAdminConfigFields();
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
