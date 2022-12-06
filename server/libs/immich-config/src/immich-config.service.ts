import {
  FFmpegConfig,
  OAuthConfig,
  SystemConfigEntity,
  SystemConfigKey,
  SystemConfigValue,
} from '@app/database/entities/system-config.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const defaults: Record<SystemConfigKey, SystemConfigValue> = {
  [SystemConfigKey.OAUTH]: {
    enabled: false,
    issuerUrl: '',
    clientId: '',
    clientSecret: '',
    scope: 'openid email profile',
    buttonText: 'Login with OAuth',
    autoRegister: true,
  },
  [SystemConfigKey.FFMPEG]: {
    crf: '23',
    preset: 'ultrafast',
    targetVideoCodec: 'libx264',
    targetAudioCodec: 'mp3',
    targetScaling: '1280:-2',
  },
};

@Injectable()
export class ImmichConfigService {
  constructor(
    @InjectRepository(SystemConfigEntity)
    private systemConfigRepository: Repository<SystemConfigEntity>,
  ) {}

  public async getFFmpegConfig() {
    return this.getConfig<FFmpegConfig>(SystemConfigKey.FFMPEG);
  }

  public async getOAuthConfig() {
    return this.getConfig<OAuthConfig>(SystemConfigKey.OAUTH);
  }

  public async updateFFmpegConfig(config: Partial<FFmpegConfig> | null): Promise<void> {
    await this.updateConfig<FFmpegConfig>(SystemConfigKey.FFMPEG, config);
  }

  public async updateOAuthConfig(config: Partial<OAuthConfig> | null): Promise<void> {
    await this.updateConfig(SystemConfigKey.OAUTH, config);
  }

  private async getConfig<T extends SystemConfigValue>(key: SystemConfigKey) {
    const override = await this.systemConfigRepository.findOne({ where: { key } });
    return Object.assign({}, defaults[key], override?.value) as T;
  }

  private async updateConfig<T>(key: SystemConfigKey, config: Partial<T> | null): Promise<void> {
    if (!config) {
      await this.systemConfigRepository.delete({ key });
    } else {
      await this.systemConfigRepository.save({ key, value: config });
    }
  }
}
