import { Body, Controller, Get, HttpStatus, Put } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved system configuration',
    type: SystemConfigDto,
  })
  @Endpoint({
    summary: 'Get system configuration',
    description: 'Retrieve the current system configuration.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getConfig(): Promise<SystemConfigDto> {
    return this.service.getSystemConfig();
  }

  @Get('defaults')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved system configuration defaults',
    type: SystemConfigDto,
  })
  @Endpoint({
    summary: 'Get system configuration defaults',
    description: 'Retrieve the default values for the system configuration.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getConfigDefaults(): SystemConfigDto {
    return this.service.getDefaults();
  }

  @Put()
  @Authenticated({ permission: Permission.SystemConfigUpdate, admin: true })
  @ApiBody({ description: 'System configuration update data', type: SystemConfigDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System configuration updated successfully',
    type: SystemConfigDto,
  })
  @Endpoint({
    summary: 'Update system configuration',
    description: 'Update the system configuration with a new system configuration.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateConfig(@Body() dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.service.updateSystemConfig(dto);
  }

  @Get('storage-template-options')
  @Authenticated({ permission: Permission.SystemConfigRead, admin: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved storage template options',
    type: SystemConfigTemplateStorageOptionDto,
  })
  @Endpoint({
    summary: 'Get storage template options',
    description: 'Retrieve exemplary storage template options.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.storageTemplateService.getStorageTemplateOptions();
  }
}
