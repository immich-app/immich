import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AdminConfigKey, AdminConfigEntity } from '@app/database/entities/admin-config.entity';
import { InjectRepository } from '@nestjs/typeorm';

export type AdminConfig = {
  [key in AdminConfigKey]: string;
};

const configDefaults: AdminConfig = {
  [AdminConfigKey.FFMPEG_CRF]: '23',
  [AdminConfigKey.FFMPEG_PRESET]: 'ultrafast',
  [AdminConfigKey.FFMPEG_TARGET_VIDEO_CODEC]: 'libx264',
  [AdminConfigKey.FFMPEG_TARGET_AUDIO_CODEC]: 'mp3',
  [AdminConfigKey.FFMPEG_TARGET_SCALING]: '1280:-2',
};

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectRepository(AdminConfigEntity)
    private systemConfigRepository: Repository<AdminConfigEntity>,
  ) {}

  getConfig = async (): Promise<AdminConfig> => {
    const config = await this.systemConfigRepository.find();

    return (Object.keys(AdminConfigKey) as Array<keyof typeof AdminConfigKey>).reduce((previous, current) => {
      const nextConfigItem = { [AdminConfigKey[current]]: getConfigValue(AdminConfigKey[current], config) };
      return { ...previous, ...nextConfigItem };
    }, configDefaults);
  };

  setConfigValues = async (values: AdminConfigEntity[]): Promise<void> => {
    await this.systemConfigRepository.upsert(values, ['key']);
  };
}

const getConfigValue = (key: AdminConfigKey, config: AdminConfigEntity[]) => {
  return (
    config.find((configEntry) => {
      return configEntry.key === key;
    })?.value ?? configDefaults[key]
  );
};
