import { BadRequestException, Body, Controller, Get, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../../middlewares/admin-role-guard.middleware';
import { SystemConfigResponseDto } from './response-dto/system-config-response.dto';
import { SetSystemConfigDto } from './dto/set-system-config';
import { SystemConfigKey } from '@app/database/entities/system-config.entity';
import { Authenticated } from '../../decorators/authenticated.decorator';

@ApiTags('Config')
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/system')
  @Authenticated({ admin: true })
  getSystemConfig(): Promise<SystemConfigResponseDto> {
    return this.configService.getAllConfig();
  }

  @Put('/system')
  @Authenticated({ admin: true })
  async putSystemConfig(@Body(ValidationPipe) body: SetSystemConfigDto): Promise<SystemConfigResponseDto> {
    if (
      body.config.filter((entry) => {
        return !Object.values(SystemConfigKey).includes(entry.key);
      }).length !== 0
    ) {
      throw new BadRequestException('Incorrect config key provided');
    }
    return this.configService.setConfigValue(body.config);
  }
}
