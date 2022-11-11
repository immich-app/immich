import { SystemConfigService } from '@app/system-config';
import { Injectable } from '@nestjs/common';
import { UpdateSystemConfigDto } from './dto/update-system-config';
import { SystemConfigResponseDto } from './response-dto/system-config-response.dto';

@Injectable()
export class ConfigService {
  constructor(private systemConfigService: SystemConfigService) {}

  async getSystemConfig(): Promise<SystemConfigResponseDto> {
    const config = await this.systemConfigService.getConfig();
    return { config };
  }

  async updateSystemConfig(dto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto> {
    await this.systemConfigService.updateConfig(dto.config);
    const config = await this.systemConfigService.getConfig();
    return { config };
  }
}
