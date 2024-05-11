import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MapThemeDto, SystemConfigDto, SystemConfigTemplateStorageOptionDto } from 'src/dtos/system-config.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemConfigService } from 'src/services/system-config.service';

@ApiTags('System Config')
@Controller('system-config')
export class SystemConfigController {
  constructor(private service: SystemConfigService) {}

  @Get()
  @Authenticated({ admin: true })
  getConfig(): Promise<SystemConfigDto> {
    return this.service.getConfig();
  }

  @Get('defaults')
  @Authenticated({ admin: true })
  getConfigDefaults(): SystemConfigDto {
    return this.service.getDefaults();
  }

  @Put()
  @Authenticated({ admin: true })
  updateConfig(@Body() dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.service.updateConfig(dto);
  }

  @Get('storage-template-options')
  @Authenticated({ admin: true })
  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.service.getStorageTemplateOptions();
  }

  @Authenticated({ sharedLink: true })
  @Get('map/style.json')
  getMapStyle(@Query() dto: MapThemeDto) {
    return this.service.getMapStyle(dto.theme);
  }
}
