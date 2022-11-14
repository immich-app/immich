import { SystemConfigEntity, SystemConfigKey, SystemConfigValue } from '@app/database/entities/system-config.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

type SystemConfigMap = Record<SystemConfigKey, SystemConfigValue>;

const configDefaults: Record<SystemConfigKey, { name: string; value: SystemConfigValue }> = {
  [SystemConfigKey.FFMPEG_CRF]: {
    name: 'FFmpeg Constant Rate Factor (-crf)',
    value: '23',
  },
  [SystemConfigKey.FFMPEG_PRESET]: {
    name: 'FFmpeg preset (-preset)',
    value: 'ultrafast',
  },
  [SystemConfigKey.FFMPEG_TARGET_VIDEO_CODEC]: {
    name: 'FFmpeg target video codec (-vcodec)',
    value: 'libx264',
  },
  [SystemConfigKey.FFMPEG_TARGET_AUDIO_CODEC]: {
    name: 'FFmpeg target audio codec (-acodec)',
    value: 'mp3',
  },
  [SystemConfigKey.FFMPEG_TARGET_SCALING]: {
    name: 'FFmpeg target scaling (-vf scale=)',
    value: '1280:-2',
  },
};

@Injectable()
export class ImmichConfigService {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private systemConfigRepository: Repository<SystemConfigEntity>,
  ) {}

  public async getSystemConfig() {
    const items = this._getDefaults();

    // override default values
    const overrides = await this.systemConfigRepository.find();
    for (const override of overrides) {
      const item = items.find((_item) => _item.key === override.key);
      if (item) {
        item.value = override.value;
      }
    }

    return items;
  }

  public async getSystemConfigMap(): Promise<SystemConfigMap> {
    const items = await this.getSystemConfig();
    const map: Partial<SystemConfigMap> = {};

    for (const { key, value } of items) {
      map[key] = value;
    }

    return map as SystemConfigMap;
  }

  public async updateSystemConfig(items: SystemConfigEntity[]): Promise<void> {
    const deletes: SystemConfigEntity[] = [];
    const updates: SystemConfigEntity[] = [];

    for (const item of items) {
      if (item.value === null || item.value === this._getDefaultValue(item.key)) {
        deletes.push(item);
        continue;
      }

      updates.push(item);
    }

    if (updates.length > 0) {
      await this.systemConfigRepository.save(updates);
    }

    if (deletes.length > 0) {
      await this.systemConfigRepository.delete({ key: In(deletes.map((item) => item.key)) });
    }
  }

  private _getDefaults() {
    return Object.values(SystemConfigKey).map((key) => ({
      key,
      defaultValue: configDefaults[key].value,
      ...configDefaults[key],
    }));
  }

  private _getDefaultValue(key: SystemConfigKey) {
    return this._getDefaults().find((item) => item.key === key)?.value || null;
  }
}
