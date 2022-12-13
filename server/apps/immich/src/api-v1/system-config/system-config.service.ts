import { Injectable } from '@nestjs/common';
import { ImmichConfigService } from 'libs/immich-config/src';
import { SystemConfigCustomStorageTemplateDto } from './dto/system-config-custom-storage-template.dto';
import { SystemConfigStorageTemplateDto } from './dto/system-config-storage-template.dto';
import { mapConfig, SystemConfigDto } from './dto/system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(private immichConfigService: ImmichConfigService) {}

  public async getConfig(): Promise<SystemConfigDto> {
    const config = await this.immichConfigService.getConfig();
    return mapConfig(config);
  }

  public getDefaults(): SystemConfigDto {
    const config = this.immichConfigService.getDefaults();
    return mapConfig(config);
  }

  public async updateConfig(dto: SystemConfigDto): Promise<SystemConfigDto> {
    await this.immichConfigService.updateConfig(dto);
    return this.getConfig();
  }

  public async updateStorageTemplate(
    dto: SystemConfigCustomStorageTemplateDto,
  ): Promise<SystemConfigStorageTemplateDto> {
    console.log('updateStorageTemplate', dto);

    const result = new SystemConfigStorageTemplateDto();
    result.template = 'yyyy/MM/dd';
    return result;
  }
}
