import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SystemConfigDto } from 'src/domain/system-config/dto/system-config.dto';
import { SystemConfigTemplateStorageOptionDto } from 'src/domain/system-config/response-dto/system-config-template-storage-option.dto';
import { MapThemeDto } from 'src/domain/system-config/system-config-map-theme.dto';
import { SystemConfigService } from 'src/domain/system-config/system-config.service';
import { AdminRoute, Authenticated } from 'src/middleware/auth.guard';

@ApiTags('System Config')
@Controller('system-config')
@Authenticated({ admin: true })
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  getConfig(): Promise<SystemConfigDto> {
    return this.service.getConfig();
  }

  @Get('defaults')
  getConfigDefaults(): SystemConfigDto {
    return this.service.getDefaults();
  }

  @Put()
  updateConfig(@Body() dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.service.updateConfig(dto);
  }

  @Get('storage-template-options')
  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.service.getStorageTemplateOptions();
  }

  @AdminRoute(false)
  @Get('map/style.json')
  getMapStyle(@Query() dto: MapThemeDto) {
    return this.service.getMapStyle(dto.theme);
  }
}
