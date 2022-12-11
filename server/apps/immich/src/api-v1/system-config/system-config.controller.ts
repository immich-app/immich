import { Body, Controller, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { SystemConfigDto } from './dto/system-config.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth()
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
}
