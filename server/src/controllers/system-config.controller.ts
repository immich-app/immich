import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemConfigDto, SystemConfigTemplateStorageOptionDto } from 'src/dtos/system-config.dto';
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
  @ApiOperation({ summary: 'Get system configuration', description: 'Retrieve the current system configuration.' })
  getConfig(): Promise<SystemConfigDto> {
    return this.service.getSystemConfig();
  }

  @Get('defaults')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @ApiOperation({
    summary: 'Get system configuration defaults',
    description: 'Retrieve the default values for the system configuration.',
  })
  getConfigDefaults(): SystemConfigDto {
    return this.service.getDefaults();
  }

  @Put()
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @ApiOperation({
    summary: 'Update system configuration',
    description: 'Update the system configuration with a new system configuration.',
  })
  updateConfig(@Body() dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.service.updateSystemConfig(dto);
  }

  @Get('storage-template-options')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @ApiOperation({
    summary: 'Get storage template options',
    description: 'Retrieve exemplary storage template options.',
  })
  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.storageTemplateService.getStorageTemplateOptions();
  }
}
