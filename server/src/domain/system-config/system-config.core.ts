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

export type SystemConfigValidator = (config: SystemConfig, newConfig: SystemConfig) => void | Promise<void>;

export const defaults = Object.freeze<SystemConfig>({
  ffmpeg: {
    crf: 23,
    threads: 0,
    preset: 'ultrafast',
    targetVideoCodec: VideoCodec.H264,
    acceptedVideoCodecs: [VideoCodec.H264],
    targetAudioCodec: AudioCodec.AAC,
    acceptedAudioCodecs: [AudioCodec.AAC],
    targetResolution: '720',
    maxBitrate: '0',
    bframes: -1,
    refs: 0,
    gopSize: 0,
    npl: 0,
    temporalAQ: false,
    cqMode: CQMode.AUTO,
    twoPass: false,
    preferredHwDevice: 'auto',
    transcode: TranscodePolicy.REQUIRED,
    tonemap: ToneMapping.HABLE,
    accel: TranscodeHWAccel.DISABLED,
  },
  job: {
    [QueueName.BACKGROUND_TASK]: { concurrency: 5 },
    [QueueName.SMART_SEARCH]: { concurrency: 2 },
    [QueueName.METADATA_EXTRACTION]: { concurrency: 5 },
    [QueueName.FACE_DETECTION]: { concurrency: 2 },
    [QueueName.SEARCH]: { concurrency: 5 },
    [QueueName.SIDECAR]: { concurrency: 5 },
    [QueueName.LIBRARY]: { concurrency: 5 },
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
    clip: {
      enabled: true,
      modelName: 'ViT-B-32__openai',
    },
    facialRecognition: {
      enabled: true,
      modelName: 'buffalo_l',
      minScore: 0.7,
      maxDistance: 0.6,
      minFaces: 3,
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
    autoLaunch: false,
    autoRegister: true,
    buttonText: 'Login with OAuth',
    clientId: '',
    clientSecret: '',
    enabled: false,
    issuerUrl: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    storageLabelClaim: 'preferred_username',
  },
  passwordLogin: {
    enabled: true,
  },
  storageTemplate: {
    enabled: false,
    hashVerificationEnabled: true,
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
    watch: {
      enabled: false,
      usePolling: false,
      interval: 10_000,
    },
  },
  server: {
    externalDomain: '',
    loginPageMessage: '',
  },
});

export enum FeatureFlag {
  SMART_SEARCH = 'smartSearch',
  FACIAL_RECOGNITION = 'facialRecognition',
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
        case FeatureFlag.SMART_SEARCH: {
          throw new BadRequestException('Smart search is not enabled');
        }
        case FeatureFlag.FACIAL_RECOGNITION: {
          throw new BadRequestException('Facial recognition is not enabled');
        }
        case FeatureFlag.SIDECAR: {
          throw new BadRequestException('Sidecar is not enabled');
        }
        case FeatureFlag.SEARCH: {
          throw new BadRequestException('Search is not enabled');
        }
        case FeatureFlag.OAUTH: {
          throw new BadRequestException('OAuth is not enabled');
        }
        case FeatureFlag.PASSWORD_LOGIN: {
          throw new BadRequestException('Password login is not enabled');
        }
        case FeatureFlag.CONFIG_FILE: {
          throw new BadRequestException('Config file is not set');
        }
        default: {
          throw new ForbiddenException(`Missing required feature: ${feature}`);
        }
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
      [FeatureFlag.SMART_SEARCH]: mlEnabled && config.machineLearning.clip.enabled,
      [FeatureFlag.FACIAL_RECOGNITION]: mlEnabled && config.machineLearning.facialRecognition.enabled,
      [FeatureFlag.MAP]: config.map.enabled,
      [FeatureFlag.REVERSE_GEOCODING]: config.reverseGeocoding.enabled,
      [FeatureFlag.SIDECAR]: true,
      [FeatureFlag.SEARCH]: true,
      [FeatureFlag.TRASH]: config.trash.enabled,
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

    const errors = await validate(plainToInstance(SystemConfigDto, config));
    if (errors.length > 0) {
      this.logger.error('Validation error', errors);
      if (configFilePath) {
        throw new Error(`Invalid value(s) in file: ${errors}`);
      }
    }

    if (!config.ffmpeg.acceptedVideoCodecs.includes(config.ffmpeg.targetVideoCodec)) {
      config.ffmpeg.acceptedVideoCodecs.unshift(config.ffmpeg.targetVideoCodec);
    }

    if (!config.ffmpeg.acceptedAudioCodecs.includes(config.ffmpeg.targetAudioCodec)) {
      config.ffmpeg.acceptedAudioCodecs.unshift(config.ffmpeg.targetAudioCodec);
    }

    return config;
  }

  public async updateConfig(newConfig: SystemConfig): Promise<SystemConfig> {
    if (await this.hasFeature(FeatureFlag.CONFIG_FILE)) {
      throw new BadRequestException('Cannot update configuration while IMMICH_CONFIG_FILE is in use');
    }

    const oldConfig = await this.getConfig();

    try {
      for (const validator of this.validators) {
        await validator(newConfig, oldConfig);
      }
    } catch (error) {
      this.logger.warn(`Unable to save system config due to a validation error: ${error}`);
      throw new BadRequestException(error instanceof Error ? error.message : error);
    }

    const updates: SystemConfigEntity[] = [];
    const deletes: SystemConfigEntity[] = [];

    for (const key of Object.values(SystemConfigKey)) {
      // get via dot notation
      const item = { key, value: _.get(newConfig, key) as SystemConfigValue };
      const defaultValue = _.get(defaults, key);
      const isMissing = !_.has(newConfig, key);

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

    const config = await this.getConfig();

    this.config$.next(config);

    return config;
  }

  public async refreshConfig() {
    const newConfig = await this.getConfig(true);

    this.config$.next(newConfig);
  }

  private async loadFromFile(filepath: string, force = false) {
    if (force || !this.configCache) {
      try {
        const file = await this.repository.readFile(filepath);
        const json = JSON.parse(file.toString());
        const overrides: SystemConfigEntity<SystemConfigValue>[] = [];

        for (const key of Object.values(SystemConfigKey)) {
          const value = _.get(json, key);
          this.unsetDeep(json, key);
          if (value !== undefined) {
            overrides.push({ key, value });
          }
        }

        if (!_.isEmpty(json)) {
          this.logger.warn(`Unknown keys found: ${JSON.stringify(json, null, 2)}`);
        }

        this.configCache = overrides;
      } catch (error: Error | any) {
        this.logger.error(`Unable to load configuration file: ${filepath}`);
        throw error;
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
