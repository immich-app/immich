import { SystemConfig, SystemConfigEntity, SystemConfigKey } from '@app/database/entities/system-config.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { DeepPartial, In, Repository } from 'typeorm';

export type SystemConfigValidator = (config: SystemConfig) => void | Promise<void>;

const defaults: SystemConfig = Object.freeze({
  ffmpeg: {
    crf: '23',
    preset: 'ultrafast',
    targetVideoCodec: 'libx264',
    targetAudioCodec: 'mp3',
    targetScaling: '1280:-2',
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
  },

  storageTemplate: {
    template: '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  },
});

@Injectable()
export class ImmichConfigService {
  private logger = new Logger(ImmichConfigService.name);
  private validators: SystemConfigValidator[] = [];

  public config$ = new Subject<SystemConfig>();

  constructor(
    @InjectRepository(SystemConfigEntity)
    private systemConfigRepository: Repository<SystemConfigEntity>,
  ) {}

  public getDefaults(): SystemConfig {
    return defaults;
  }

  public addValidator(validator: SystemConfigValidator) {
    this.validators.push(validator);
  }

  public async getConfig() {
    const overrides = await this.systemConfigRepository.find();
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
      await this.systemConfigRepository.save(updates);
    }

    if (deletes.length > 0) {
      await this.systemConfigRepository.delete({ key: In(deletes.map((item) => item.key)) });
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
