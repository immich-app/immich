import { Injectable } from '@nestjs/common';
import { ImmichConfigService } from 'libs/immich-config/src';
import { SystemConfigUpdateDto } from './dto/system-config-update.dto';
import { mapConfig, SystemConfigResponseDto } from './response-dto/system-config-response.dto';

@Injectable()
export class SystemConfigService {
  constructor(private immichConfigService: ImmichConfigService) {}

  public async getConfig(): Promise<SystemConfigResponseDto> {
    const config = await this.immichConfigService.getConfig();
    return mapConfig(config);
  }

  public async updateConfig(dto: SystemConfigUpdateDto): Promise<SystemConfigResponseDto> {
    await this.immichConfigService.updateConfig(dto);
    return this.getConfig();
  }
}
