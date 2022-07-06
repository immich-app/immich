import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigKey, AdminConfigEntity } from '@app/database/entities/admin-config.entity';
import { InjectRepository } from '@nestjs/typeorm';

export type AdminConfig = {
  [key in ConfigKey]: string;
};

const configDefaults: AdminConfig = {
  [ConfigKey.FFMPEG_CRF]: '23',
  [ConfigKey.FFMPEG_PRESET]: 'ultrafast',
  [ConfigKey.FFMPEG_TARGET_VIDEO_CODEC]: 'libx264',
  [ConfigKey.FFMPEG_TARGET_AUDIO_CODEC]: 'mp3',
  [ConfigKey.FFMEG_TARGET_SCALING]: '1280:-2',
};

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectRepository(AdminConfigEntity)
    private systemConfigRepository: Repository<AdminConfigEntity>,
  ) {}

  getConfig = async (): Promise<AdminConfig> => {
    const config = await this.systemConfigRepository.find();

    return (Object.keys(ConfigKey) as Array<keyof typeof ConfigKey>).reduce((previous, current) => {
      const nextConfigItem = { [ConfigKey[current]]: getConfigValue(ConfigKey[current], config) };
      return { ...previous, ...nextConfigItem };
    }, configDefaults);
  };
}

const getConfigValue = (key: ConfigKey, config: AdminConfigEntity[]) => {
  return (
    config.find((configEntry) => {
      return configEntry.key === key;
    })?.value ?? configDefaults[key]
  );
};
