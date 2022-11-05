import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SystemConfigKey, SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { InjectRepository } from '@nestjs/typeorm';

export type SystemConfig = {
  [key in SystemConfigKey]: string;
};

const configDefaults: SystemConfig = {
  [SystemConfigKey.FFMPEG_CRF]: '23',
  [SystemConfigKey.FFMPEG_PRESET]: 'ultrafast',
  [SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC]: 'libx264',
  [SystemConfigKey.FFMPEG_TARGET_AUDIO_CODEC]: 'mp3',
  [SystemConfigKey.FFMPEG_TARGET_SCALING]: '1280:-2',
};

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private systemConfigRepository: Repository<SystemConfigEntity>,
  ) {}

  getConfig = async (): Promise<SystemConfig> => {
    const config = await this.systemConfigRepository.find();

    return (Object.keys(SystemConfigKey) as Array<keyof typeof SystemConfigKey>).reduce((previous, current) => {
      const nextConfigItem = { [SystemConfigKey[current]]: getConfigValue(SystemConfigKey[current], config) };
      return { ...previous, ...nextConfigItem };
    }, configDefaults);
  };

  setConfigValues = async (values: SystemConfigEntity[]): Promise<void> => {
    await this.systemConfigRepository.upsert(values, ['key']);
  };
}

const getConfigValue = (key: SystemConfigKey, config: SystemConfigEntity[]) => {
  return (
    config.find((configEntry) => {
      return configEntry.key === key;
    })?.value ?? configDefaults[key]
  );
};
