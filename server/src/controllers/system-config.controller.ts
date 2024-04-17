import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from 'src/dtos/auth.dto';
import { MapThemeDto, SystemConfigDto, SystemConfigTemplateStorageOptionDto } from 'src/dtos/system-config.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemConfigService } from 'src/services/system-config.service';

@ApiTags('System Config')
@Controller('system-config')
export class SystemConfigController {
  constructor(private service: SystemConfigService) {}

  @Get()
  @Authenticated(Permission.SYSTEM_CONFIG_READ)
  getConfig(): Promise<SystemConfigDto> {
    return this.service.getConfig();
  }

  @Get('defaults')
  @Authenticated(Permission.SYSTEM_CONFIG_READ)
  getConfigDefaults(): SystemConfigDto {
    return this.service.getDefaults();
  }

  @Put()
  @Authenticated(Permission.SYSTEM_CONFIG_UPDATE)
  updateConfig(@Body() dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.service.updateConfig(dto);
  }

  @Get('storage-template-options')
  @Authenticated(Permission.SYSTEM_CONFIG_READ)
  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.service.getStorageTemplateOptions();
  }

  @Get('map/style.json')
  @Authenticated(Permission.MAP_READ, { sharedLink: true })
  getMapStyle(@Query() dto: MapThemeDto) {
    return this.service.getMapStyle(dto.theme);
  }
}
