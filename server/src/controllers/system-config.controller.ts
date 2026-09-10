import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AdminConfigDto, ConfigTemplateStorageOptionDto } from 'src/dtos/config.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { SystemConfigService } from 'src/services/system-config.service';

@ApiTags(ApiTag.SystemConfig)
@Controller('system-config')
export class SystemConfigController {
  constructor(
    private service: SystemConfigService,
    private storageTemplateService: StorageTemplateService,
  ) {}

  @Get()
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get system configuration',
    description: 'Retrieve the current system configuration.',
    history: new HistoryBuilder()
      .added('v1')
      .beta('v1')
      .stable('v2')
      .deprecated('v3.2.0', { replacementId: 'getAdminConfig' }),
  })
  getConfig(): Promise<AdminConfigDto> {
    return this.service.getAdminConfig();
  }

  @Get('defaults')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get system configuration defaults',
    description: 'Retrieve the default values for the system configuration.',
    history: new HistoryBuilder()
      .added('v1')
      .beta('v1')
      .stable('v2')
      .deprecated('v3.2.0', { replacementId: 'getAdminConfigDefaults' }),
  })
  getConfigDefaults(): AdminConfigDto {
    return this.service.getAdminConfigDefaults();
  }

  @Put()
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @Endpoint({
    summary: 'Update system configuration',
    description: 'Update the system configuration with a new system configuration.',
    history: new HistoryBuilder()
      .added('v1')
      .beta('v1')
      .stable('v2')
      .deprecated('v3.2.0', { replacementId: 'updateAdminConfig' }),
  })
  updateConfig(@Body() dto: AdminConfigDto): Promise<AdminConfigDto> {
    return this.service.updateAdminConfig(dto);
  }

  @Get('storage-template-options')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @Endpoint({
    summary: 'Get storage template options',
    description: 'Retrieve exemplary storage template options.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getStorageTemplateOptions(): ConfigTemplateStorageOptionDto {
    return this.storageTemplateService.getStorageTemplateOptions();
  }
}
