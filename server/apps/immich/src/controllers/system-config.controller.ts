import { SystemConfigDto, SystemConfigService, SystemConfigTemplateStorageOptionDto } from '@app/domain';
import { Body, Controller, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('System Config')
@Authenticated({ admin: true })
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  public getConfig(): Promise<SystemConfigDto> {
    return this.systemConfigService.getConfig();
  }

  @Get('defaults')
  public getDefaults(): SystemConfigDto {
    return this.systemConfigService.getDefaults();
  }

  @Put()
  public updateConfig(@Body(ValidationPipe) dto: SystemConfigDto): Promise<SystemConfigDto> {
    return this.systemConfigService.updateConfig(dto);
  }

  @Get('storage-template-options')
  public getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return this.systemConfigService.getStorageTemplateOptions();
  }
}
