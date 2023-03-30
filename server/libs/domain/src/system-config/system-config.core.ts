import { SystemConfig, SystemConfigEntity, SystemConfigKey, TranscodePreset } from '@app/infra/entities';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { DeepPartial } from 'typeorm';
import { ISystemConfigRepository } from './system-config.repository';

export type SystemConfigValidator = (config: SystemConfig) => void | Promise<void>;

const defaults: SystemConfig = Object.freeze({
  ffmpeg: {
    crf: '23',
    preset: 'ultrafast',
    targetVideoCodec: 'h264',
    targetAudioCodec: 'aac',
    targetScaling: '1280:-2',
    transcode: TranscodePreset.REQUIRED,
  },
  oauth: {
    enabled: false,
    issuerUrl: '',
    clientId: '',
    clientSecret: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
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
});

const singleton = new Subject<SystemConfig>();

@Injectable()
export class SystemConfigCore {
  private logger = new Logger(SystemConfigCore.name);
  private validators: SystemConfigValidator[] = [];

  public config$ = singleton;

  constructor(private repository: ISystemConfigRepository) {}

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
      const item = { key, value: _.get(config, key) };
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
