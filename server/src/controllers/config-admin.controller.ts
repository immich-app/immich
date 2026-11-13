import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import {
  AdminConfigDto,
  StorageTemplateOptionsResponseDto,
  StorageTemplatePreviewDto,
  StorageTemplatePreviewResponseDto,
} from 'src/dtos/config.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Authenticated } from 'src/middleware/auth.guard.js';
import { StorageTemplateService } from 'src/services/storage-template.service.js';
import { SystemConfigService } from 'src/services/system-config.service.js';

@ApiTags(ApiTag.ConfigAdmin)
@Controller('admin/config')
export class ConfigAdminController {
  constructor(
    private service: SystemConfigService,
    private storageTemplateService: StorageTemplateService,
  ) {}

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

  @Get('storage-template')
  @Authenticated({ permission: Permission.AdminConfigRead, admin: true })
  @Endpoint({
    summary: 'Get storage template options',
    description: 'Retrieve the storage template variables and the preset templates, each with an example path.',
    history: HistoryBuilder.v4().alpha('v4.0.0'),
  })
  getAdminStorageTemplateOptions(): StorageTemplateOptionsResponseDto {
    return this.storageTemplateService.getAdminStorageTemplateOptions();
  }

  @Post('storage-template/preview')
  @Authenticated({ permission: Permission.AdminConfigRead, admin: true })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Preview a storage template',
    description: 'Render an example path from the provided storage template.',
    history: HistoryBuilder.v4().alpha('v4.0.0'),
  })
  previewStorageTemplate(@Body() dto: StorageTemplatePreviewDto): StorageTemplatePreviewResponseDto {
    return this.storageTemplateService.previewStorageTemplate(dto);
  }
}
