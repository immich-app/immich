import {
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedPresetTokens,
  supportedSecondTokens,
  supportedYearTokens,
} from '@app/storage/constants/supported-datetime-template';
import { Injectable } from '@nestjs/common';
import { ImmichConfigService } from 'libs/immich-config/src';
import { mapConfig, SystemConfigDto } from './dto/system-config.dto';
import { SystemConfigTemplateStorageOptionDto } from './response-dto/system-config-template-storage-option.dto';

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
    const config = await this.immichConfigService.updateConfig(dto);
    return mapConfig(config);
  }

  public getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    const options = new SystemConfigTemplateStorageOptionDto();

    options.dayOptions = supportedDayTokens;
    options.monthOptions = supportedMonthTokens;
    options.yearOptions = supportedYearTokens;
    options.hourOptions = supportedHourTokens;
    options.minuteOptions = supportedMinuteTokens;
    options.secondOptions = supportedSecondTokens;
    options.presetOptions = supportedPresetTokens;

    return options;
  }
}
