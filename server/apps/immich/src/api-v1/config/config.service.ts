import { Injectable } from '@nestjs/common';
import { AdminConfigResponseDto } from './response-dto/admin-config-response.dto';
import { AdminConfigService } from '@app/admin-config';
import { AdminConfigEntity } from '@app/database/entities/admin-config.entity';

@Injectable()
export class ConfigService {
  constructor(private adminConfigService: AdminConfigService) {}

  async getAllConfig(): Promise<AdminConfigResponseDto> {
    const config = await this.adminConfigService.getConfig();
    return { config };
  }

  async setConfigValue(values: AdminConfigEntity[]): Promise<AdminConfigResponseDto> {
    await this.adminConfigService.setConfigValues(values);
    const config = await this.adminConfigService.getConfig();
    return { config };
  }
}
