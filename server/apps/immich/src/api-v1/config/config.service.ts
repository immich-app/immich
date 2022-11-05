import { Injectable } from '@nestjs/common';
import { SystemConfigResponseDto } from './response-dto/system-config-response.dto';
import { SystemConfigService } from '@app/system-config';
import { SystemConfigEntity } from '@app/database/entities/system-config.entity';

@Injectable()
export class ConfigService {
  constructor(private systemConfigService: SystemConfigService) {}

  async getAllConfig(): Promise<SystemConfigResponseDto> {
    const config = await this.systemConfigService.getConfig();
    return { config };
  }

  async setConfigValue(values: SystemConfigEntity[]): Promise<SystemConfigResponseDto> {
    await this.systemConfigService.setConfigValues(values);
    const config = await this.systemConfigService.getConfig();
    return { config };
  }
}
