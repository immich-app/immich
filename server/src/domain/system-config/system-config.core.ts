import {
  AudioCodec,
  SystemConfig,
  SystemConfigEntity,
  SystemConfigKey,
  SystemConfigValue,
  ToneMapping,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
} from '@app/infra/entities';
import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { DeepPartial } from 'typeorm';
import { QueueName } from '../job/job.constants';
import { ISystemConfigRepository } from './system-config.repository';

export type SystemConfigValidator = (config: SystemConfig) => void | Promise<void>;

export const defaults = Object.freeze<SystemConfig>({
  ffmpeg: {
    crf: 23,
    threads: 0,
    preset: 'ultrafast',
    targetVideoCodec: VideoCodec.H264,
    targetAudioCodec: AudioCodec.AAC,
    targetResolution: '720',
    maxBitrate: '0',
    twoPass: false,
    transcode: TranscodePolicy.REQUIRED,
    tonemap: ToneMapping.HABLE,
    accel: TranscodeHWAccel.DISABLED,
  },
  job: {
    [QueueName.BACKGROUND_TASK]: { concurrency: 5 },
    [QueueName.CLIP_ENCODING]: { concurrency: 2 },
    [QueueName.METADATA_EXTRACTION]: { concurrency: 5 },
    [QueueName.OBJECT_TAGGING]: { concurrency: 2 },
    [QueueName.RECOGNIZE_FACES]: { concurrency: 2 },
    [QueueName.SEARCH]: { concurrency: 5 },
    [QueueName.SIDECAR]: { concurrency: 5 },
    [QueueName.STORAGE_TEMPLATE_MIGRATION]: { concurrency: 5 },
    [QueueName.THUMBNAIL_GENERATION]: { concurrency: 5 },
    [QueueName.VIDEO_CONVERSION]: { concurrency: 1 },
  },
  machineLearning: {
    enabled: process.env.IMMICH_MACHINE_LEARNING_ENABLED !== 'false',
    url: process.env.IMMICH_MACHINE_LEARNING_URL || 'http://immich-machine-learning:3003',
    facialRecognitionEnabled: true,
    tagImageEnabled: true,
    clipEncodeEnabled: true,
  },
  oauth: {
    enabled: false,
    issuerUrl: '',
    clientId: '',
    clientSecret: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
    storageLabelClaim: 'preferred_username',
    buttonText: 'Login with OAuth',
    autoRegister: true,
    autoLaunch: false,
  },
  passwordLogin: {
    enabled: true,
  },

  storageTemplate: {
    template: '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  },

  thumbnail: {
    webpSize: 250,
    jpegSize: 1440,
  },
});

export enum FeatureFlag {
  CLIP_ENCODE = 'clipEncode',
  FACIAL_RECOGNITION = 'facialRecognition',
  TAG_IMAGE = 'tagImage',
  SIDECAR = 'sidecar',
  SEARCH = 'search',
  OAUTH = 'oauth',
  OAUTH_AUTO_LAUNCH = 'oauthAutoLaunch',
  PASSWORD_LOGIN = 'passwordLogin',
}

export type FeatureFlags = Record<FeatureFlag, boolean>;

const singleton = new Subject<SystemConfig>();

@Injectable()
export class SystemConfigCore {
  private logger = new Logger(SystemConfigCore.name);
  private validators: SystemConfigValidator[] = [];

  public config$ = singleton;

  constructor(private repository: ISystemConfigRepository) {}

  async requireFeature(feature: FeatureFlag) {
    const hasFeature = await this.hasFeature(feature);
    if (!hasFeature) {
      switch (feature) {
        case FeatureFlag.CLIP_ENCODE:
          throw new BadRequestException('Clip encoding is not enabled');
        case FeatureFlag.FACIAL_RECOGNITION:
          throw new BadRequestException('Facial recognition is not enabled');
        case FeatureFlag.TAG_IMAGE:
          throw new BadRequestException('Image tagging is not enabled');
        case FeatureFlag.SIDECAR:
          throw new BadRequestException('Sidecar is not enabled');
        case FeatureFlag.SEARCH:
          throw new BadRequestException('Search is not enabled');
        case FeatureFlag.OAUTH:
          throw new BadRequestException('OAuth is not enabled');
        case FeatureFlag.PASSWORD_LOGIN:
          throw new BadRequestException('Password login is not enabled');
        default:
          throw new ForbiddenException(`Missing required feature: ${feature}`);
      }
    }
  }

  async hasFeature(feature: FeatureFlag) {
    const features = await this.getFeatures();
    return features[feature] ?? false;
  }

  async getFeatures(): Promise<FeatureFlags> {
    const config = await this.getConfig();
    const mlEnabled = config.machineLearning.enabled;

    return {
      [FeatureFlag.CLIP_ENCODE]: mlEnabled && config.machineLearning.clipEncodeEnabled,
      [FeatureFlag.FACIAL_RECOGNITION]: mlEnabled && config.machineLearning.facialRecognitionEnabled,
      [FeatureFlag.TAG_IMAGE]: mlEnabled && config.machineLearning.tagImageEnabled,
      [FeatureFlag.SIDECAR]: true,
      [FeatureFlag.SEARCH]: process.env.TYPESENSE_ENABLED !== 'false',

      // TODO: use these instead of `POST oauth/config`
      [FeatureFlag.OAUTH]: config.oauth.enabled,
      [FeatureFlag.OAUTH_AUTO_LAUNCH]: config.oauth.autoLaunch,
      [FeatureFlag.PASSWORD_LOGIN]: config.passwordLogin.enabled,
    };
  }

  public getDefaults(): SystemConfig {
    return defaults;
  }

  public addValidator(validator: SystemConfigValidator) {
    this.validators.push(validator);
  }

  public async getConfig() {
    const overrides = await this.repository.load();
    const config: DeepPartial<SystemConfig> = {};
    for (const { key, value } of overrides) {
      // set via dot notation
      _.set(config, key, value);
    }

    return _.defaultsDeep(config, defaults) as SystemConfig;
  }

  public async updateConfig(config: SystemConfig): Promise<SystemConfig> {
    try {
      for (const validator of this.validators) {
        await validator(config);
      }
    } catch (e) {
      this.logger.warn(`Unable to save system config due to a validation error: ${e}`);
      throw new BadRequestException(e instanceof Error ? e.message : e);
    }

    const updates: SystemConfigEntity[] = [];
    const deletes: SystemConfigEntity[] = [];

    for (const key of Object.values(SystemConfigKey)) {
      // get via dot notation
      const item = { key, value: _.get(config, key) as SystemConfigValue };
      const defaultValue = _.get(defaults, key);
      const isMissing = !_.has(config, key);

      if (isMissing || item.value === null || item.value === '' || item.value === defaultValue) {
        deletes.push(item);
        continue;
      }

      updates.push(item);
    }

    if (updates.length > 0) {
      await this.repository.saveAll(updates);
    }

    if (deletes.length > 0) {
      await this.repository.deleteKeys(deletes.map((item) => item.key));
    }

    const newConfig = await this.getConfig();

    this.config$.next(newConfig);

    return newConfig;
  }

  public async refreshConfig() {
    const newConfig = await this.getConfig();

    this.config$.next(newConfig);
  }
}
