import { Injectable } from '@nestjs/common';
import AsyncLock from 'async-lock';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { load as loadYaml } from 'js-yaml';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { SystemConfig, defaults } from 'src/config';
import { SystemConfigDto } from 'src/dtos/system-config.dto';
import { SystemConfigEntity, SystemConfigKey, SystemConfigValue } from 'src/entities/system-config.entity';
import { DatabaseLock } from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';

export type SystemConfigValidator = (config: SystemConfig, newConfig: SystemConfig) => void | Promise<void>;

let instance: SystemConfigCore | null;

@Injectable()
export class SystemConfigCore {
  private readonly asyncLock = new AsyncLock();
  private config: SystemConfig | null = null;
  private lastUpdated: number | null = null;

  config$ = new Subject<SystemConfig>();

  private constructor(
    private repository: ISystemConfigRepository,
    private logger: ILoggerRepository,
  ) {}

  static create(repository: ISystemConfigRepository, logger: ILoggerRepository) {
    if (!instance) {
      instance = new SystemConfigCore(repository, logger);
    }
    return instance;
  }

  static reset() {
    instance = null;
  }

  async getConfig(force = false): Promise<SystemConfig> {
    if (force || !this.config) {
      const lastUpdated = this.lastUpdated;
      await this.asyncLock.acquire(DatabaseLock[DatabaseLock.GetSystemConfig], async () => {
        if (lastUpdated === this.lastUpdated) {
          this.config = await this.buildConfig();
          this.lastUpdated = Date.now();
        }
      });
    }

    return this.config!;
  }

  async updateConfig(newConfig: SystemConfig): Promise<SystemConfig> {
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

    const config = await this.getConfig(true);

    this.config$.next(config);

    return config;
  }

  async refreshConfig() {
    const newConfig = await this.getConfig(true);
    this.config$.next(newConfig);
  }

  isUsingConfigFile() {
    return !!process.env.IMMICH_CONFIG_FILE;
  }

  private async buildConfig() {
    const config = _.cloneDeep(defaults);
    const overrides = this.isUsingConfigFile()
      ? await this.loadFromFile(process.env.IMMICH_CONFIG_FILE as string)
      : await this.repository.load();

    for (const { key, value } of overrides) {
      // set via dot notation
      _.set(config, key, value);
    }

    const errors = await validate(plainToInstance(SystemConfigDto, config));
    if (errors.length > 0) {
      if (this.isUsingConfigFile()) {
        throw new Error(`Invalid value(s) in file: ${errors}`);
      } else {
        this.logger.error('Validation error', errors);
      }
    }

    if (!config.ffmpeg.acceptedVideoCodecs.includes(config.ffmpeg.targetVideoCodec)) {
      config.ffmpeg.acceptedVideoCodecs.push(config.ffmpeg.targetVideoCodec);
    }

    if (!config.ffmpeg.acceptedAudioCodecs.includes(config.ffmpeg.targetAudioCodec)) {
      config.ffmpeg.acceptedAudioCodecs.push(config.ffmpeg.targetAudioCodec);
    }

    return config;
  }

  private async loadFromFile(filepath: string) {
    try {
      const file = await this.repository.readFile(filepath);
      const config = loadYaml(file.toString()) as any;
      const overrides: SystemConfigEntity<SystemConfigValue>[] = [];

      for (const key of Object.values(SystemConfigKey)) {
        const value = _.get(config, key);
        this.unsetDeep(config, key);
        if (value !== undefined) {
          overrides.push({ key, value });
        }
      }

      if (!_.isEmpty(config)) {
        this.logger.warn(`Unknown keys found: ${JSON.stringify(config, null, 2)}`);
      }

      return overrides;
    } catch (error: Error | any) {
      this.logger.error(`Unable to load configuration file: ${filepath}`);
      throw error;
    }
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
