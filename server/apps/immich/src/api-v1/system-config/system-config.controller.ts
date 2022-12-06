import { Body, Controller, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { SystemConfigUpdateDto } from './dto/system-config-update.dto';
import { SystemConfigResponseDto } from './response-dto/system-config-response.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth()
@Authenticated({ admin: true })
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  public getConfig(): Promise<SystemConfigResponseDto> {
    return this.systemConfigService.getConfig();
  }

  @Put()
  public updateConfig(@Body(ValidationPipe) dto: SystemConfigUpdateDto): Promise<SystemConfigResponseDto> {
    return this.systemConfigService.updateConfig(dto);
  }
}
