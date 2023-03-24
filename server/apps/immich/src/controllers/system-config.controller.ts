import { SystemConfigDto, SystemConfigService, SystemConfigTemplateStorageOptionDto } from '@app/domain';
import { Body, Controller, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../decorators/authenticated.decorator';

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
  getDefaults(): SystemConfigDto {
    return this.service.getDefaults();
  }

  @Put()
  updateConfig(@Body(ValidationPipe) dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.service.updateConfig(dto);
  }

  @Get('storage-template-options')
  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.service.getStorageTemplateOptions();
  }
}
