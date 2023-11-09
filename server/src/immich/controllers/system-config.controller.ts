import { SystemConfigDto, SystemConfigService, SystemConfigTemplateStorageOptionDto } from '@app/domain';
import { MapThemeDto } from '@app/domain/system-config/system-config-map-theme.dto';
import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('System Config')
@Controller('system-config')
@UseValidation()
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Authenticated({ admin: true })
  @Get()
  getConfig(): Promise<SystemConfigDto> {
    return this.service.getConfig();
  }

  @Authenticated({ admin: true })
  @Get('defaults')
  getConfigDefaults(): SystemConfigDto {
    return this.service.getDefaults();
  }

  @Authenticated({ admin: true })
  @Put()
  updateConfig(@Body() dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.service.updateConfig(dto);
  }

  @Authenticated({ admin: true })
  @Get('storage-template-options')
  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.service.getStorageTemplateOptions();
  }

  @Authenticated({ admin: false })
  @Get('map/style.json')
  getMapStyle(@Query() dto: MapThemeDto) {
    return this.service.getMapStyle(dto.theme);
  }
}
