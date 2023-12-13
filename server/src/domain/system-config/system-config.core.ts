import {
  AudioCodec,
  Colorspace,
  CQMode,
  LogLevel,
  SystemConfig,
  SystemConfigEntity,
  SystemConfigKey,
  SystemConfigValue,
  ToneMapping,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
} from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { QueueName } from '../job/job.constants';
import { ISystemConfigRepository } from '../repositories';
import { SystemConfigDto } from './dto';

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
    bframes: -1,
    refs: 0,
    gopSize: 0,
    npl: 0,
    temporalAQ: false,
    cqMode: CQMode.AUTO,
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
    [QueueName.LIBRARY]: { concurrency: 5 },
    [QueueName.STORAGE_TEMPLATE_MIGRATION]: { concurrency: 5 },
    [QueueName.MIGRATION]: { concurrency: 5 },
    [QueueName.THUMBNAIL_GENERATION]: { concurrency: 5 },
    [QueueName.VIDEO_CONVERSION]: { concurrency: 1 },
  },
  logging: {
    enabled: true,
    level: LogLevel.LOG,
  },
  machineLearning: {
    enabled: process.env.IMMICH_MACHINE_LEARNING_ENABLED !== 'false',
    url: process.env.IMMICH_MACHINE_LEARNING_URL || 'http://immich-machine-learning:3003',
    classification: {
      enabled: true,
      modelName: 'microsoft/resnet-50',
      minScore: 0.9,
    },
    clip: {
      enabled: true,
      modelName: 'ViT-B-32__openai',
    },
    facialRecognition: {
      enabled: true,
      modelName: 'buffalo_l',
      minScore: 0.7,
      maxDistance: 0.6,
      minFaces: 1,
    },
  },
  map: {
    enabled: true,
    lightStyle: '',
    darkStyle: '',
  },
  reverseGeocoding: {
    enabled: true,
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
    quality: 80,
    colorspace: Colorspace.P3,
  },
  newVersionCheck: {
    enabled: true,
  },
  trash: {
    enabled: true,
    days: 30,
  },
  theme: {
    customCss: '',
  },
  library: {
    scan: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_MIDNIGHT,
    },
  },
});

export enum FeatureFlag {
  CLIP_ENCODE = 'clipEncode',
  FACIAL_RECOGNITION = 'facialRecognition',
  TAG_IMAGE = 'tagImage',
  MAP = 'map',
  REVERSE_GEOCODING = 'reverseGeocoding',
  SIDECAR = 'sidecar',
  SEARCH = 'search',
  OAUTH = 'oauth',
  OAUTH_AUTO_LAUNCH = 'oauthAutoLaunch',
  PASSWORD_LOGIN = 'passwordLogin',
  CONFIG_FILE = 'configFile',
  TRASH = 'trash',
}

export type FeatureFlags = Record<FeatureFlag, boolean>;

let instance: SystemConfigCore | null;

@Injectable()
export class SystemConfigCore {
  private logger = new ImmichLogger(SystemConfigCore.name);
  private validators: SystemConfigValidator[] = [];
  private configCache: SystemConfigEntity<SystemConfigValue>[] | null = null;

  public config$ = new Subject<SystemConfig>();

  private constructor(private repository: ISystemConfigRepository) {}

  static create(repository: ISystemConfigRepository) {
    if (!instance) {
      instance = new SystemConfigCore(repository);
    }
    return instance;
  }

  static reset() {
    instance = null;
  }

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
        case FeatureFlag.CONFIG_FILE:
          throw new BadRequestException('Config file is not set');
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
      [FeatureFlag.CLIP_ENCODE]: mlEnabled && config.machineLearning.clip.enabled,
      [FeatureFlag.FACIAL_RECOGNITION]: mlEnabled && config.machineLearning.facialRecognition.enabled,
      [FeatureFlag.TAG_IMAGE]: mlEnabled && config.machineLearning.classification.enabled,
      [FeatureFlag.MAP]: config.map.enabled,
      [FeatureFlag.REVERSE_GEOCODING]: config.reverseGeocoding.enabled,
      [FeatureFlag.SIDECAR]: true,
      [FeatureFlag.SEARCH]: true,
      [FeatureFlag.TRASH]: config.trash.enabled,

      // TODO: use these instead of `POST oauth/config`
      [FeatureFlag.OAUTH]: config.oauth.enabled,
      [FeatureFlag.OAUTH_AUTO_LAUNCH]: config.oauth.autoLaunch,
      [FeatureFlag.PASSWORD_LOGIN]: config.passwordLogin.enabled,
      [FeatureFlag.CONFIG_FILE]: !!process.env.IMMICH_CONFIG_FILE,
    };
  }

  public getDefaults(): SystemConfig {
    return defaults;
  }

  public addValidator(validator: SystemConfigValidator) {
    this.validators.push(validator);
  }

  public async getConfig(force = false): Promise<SystemConfig> {
    const configFilePath = process.env.IMMICH_CONFIG_FILE;
    const config = _.cloneDeep(defaults);
    const overrides = configFilePath ? await this.loadFromFile(configFilePath, force) : await this.repository.load();

    for (const { key, value } of overrides) {
      // set via dot notation
      _.set(config, key, value);
    }

    const errors = await validate(plainToInstance(SystemConfigDto, config), {
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });
    if (errors.length > 0) {
      this.logger.error('Validation error', errors);
      if (configFilePath) {
        throw new Error(`Invalid value(s) in file: ${errors}`);
      }
    }

    return config;
  }

  public async updateConfig(config: SystemConfig): Promise<SystemConfig> {
    if (await this.hasFeature(FeatureFlag.CONFIG_FILE)) {
      throw new BadRequestException('Cannot update configuration while IMMICH_CONFIG_FILE is in use');
    }

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

      if (
        isMissing ||
        item.value === null ||
        item.value === '' ||
        item.value === defaultValue ||
        _.isEqual(item.value, defaultValue)
      ) {
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
    const newConfig = await this.getConfig(true);

    this.config$.next(newConfig);
  }

  private async loadFromFile(filepath: string, force = false) {
    if (force || !this.configCache) {
      try {
        const file = JSON.parse((await this.repository.readFile(filepath)).toString());
        const overrides: SystemConfigEntity<SystemConfigValue>[] = [];

        for (const key of Object.values(SystemConfigKey)) {
          const value = _.get(file, key);
          this.unsetDeep(file, key);
          if (value !== undefined) {
            overrides.push({ key, value });
          }
        }

        if (!_.isEmpty(file)) {
          throw new Error(`Unknown keys found: ${JSON.stringify(file)}`);
        }

        this.configCache = overrides;
      } catch (error: Error | any) {
        this.logger.error(`Unable to load configuration file: ${filepath} due to ${error}`, error?.stack);
        throw new Error('Invalid configuration file');
      }
    }

    return this.configCache;
  }

  private unsetDeep(object: object, key: string) {
    _.unset(object, key);
    const path = key.split('.');
    while (path.pop()) {
      if (!_.isEmpty(_.get(object, path))) {
        return;
      }
      _.unset(object, path);
    }
  }
}
