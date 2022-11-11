import { Body, Controller, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { ConfigService } from './config.service';
import { UpdateSystemConfigDto } from './dto/update-system-config';
import { SystemConfigResponseDto } from './response-dto/system-config-response.dto';

@ApiTags('Config')
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/system')
  @Authenticated({ admin: true })
  getSystemConfig(): Promise<SystemConfigResponseDto> {
    return this.configService.getSystemConfig();
  }

  @Put('/system')
  @Authenticated({ admin: true })
  async updateSystemConfig(@Body(ValidationPipe) dto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto> {
    return this.configService.updateSystemConfig(dto);
  }
}
