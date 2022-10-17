import { BadRequestException, Body, Controller, Get, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../../middlewares/admin-role-guard.middleware';
import { AdminConfigResponseDto } from './response-dto/admin-config-response.dto';
import { SetAdminConfigDto } from './dto/set-admin-config';
import { AdminConfigKey } from '@app/database/entities/admin-config.entity';

@UseGuards(JwtAuthGuard)
@UseGuards(AdminRolesGuard)
@ApiTags('Admin Config')
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
  constructor(private readonly adminConfigService: ConfigService) {}

  @Get('/admin')
  getAdminConfig(): Promise<AdminConfigResponseDto> {
    return this.adminConfigService.getAllConfig();
  }

  @Put('/admin')
  async putAdminConfig(@Body(ValidationPipe) body: SetAdminConfigDto): Promise<AdminConfigResponseDto> {
    if (
      body.config.filter((entry) => {
        return !Object.values(AdminConfigKey).includes(entry.key);
      }).length !== 0
    ) {
      throw new BadRequestException('Incorrect config key provided');
    }
    return this.adminConfigService.setConfigValue(body.config);
  }
}
