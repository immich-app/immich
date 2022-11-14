import { Body, Controller, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { UpdateSystemConfigDto } from './dto/update-system-config';
import { SystemConfigResponseDto } from './response-dto/system-config-response.dto';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth()
@Authenticated({ admin: true })
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  getConfig(): Promise<SystemConfigResponseDto> {
    return this.systemConfigService.getConfig();
  }

  @Put()
  async updateConfig(@Body(ValidationPipe) dto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto> {
    return this.systemConfigService.updateConfig(dto);
  }
}
