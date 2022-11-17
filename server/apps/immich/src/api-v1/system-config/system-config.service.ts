import { Injectable } from '@nestjs/common';
import { ImmichConfigService } from 'libs/immich-config/src';
import { UpdateSystemConfigDto } from './dto/update-system-config';
import { SystemConfigResponseDto } from './response-dto/system-config-response.dto';

@Injectable()
export class SystemConfigService {
  constructor(private immichConfigService: ImmichConfigService) {}

  async getConfig(): Promise<SystemConfigResponseDto> {
    const config = await this.immichConfigService.getSystemConfig();
    return { config };
  }

  async updateConfig(dto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto> {
    await this.immichConfigService.updateSystemConfig(dto.config);
    const config = await this.immichConfigService.getSystemConfig();
    return { config };
  }
}
