import { Injectable } from '@nestjs/common';
import AsyncLock from 'async-lock';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { load as loadYaml } from 'js-yaml';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { SystemConfig, defaults } from 'src/config';
import { SystemConfigDto } from 'src/dtos/system-config.dto';
import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
import { DatabaseLock } from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { getKeysDeep, unsetDeep } from 'src/utils/misc';
import { DeepPartial } from 'typeorm';

export type SystemConfigValidator = (config: SystemConfig, newConfig: SystemConfig) => void | Promise<void>;

let instance: SystemConfigCore | null;

@Injectable()
export class SystemConfigCore {
  private readonly asyncLock = new AsyncLock();
  private config: SystemConfig | null = null;
  private lastUpdated: number | null = null;

  config$ = new Subject<SystemConfig>();

  private constructor(
    private repository: ISystemMetadataRepository,
    private logger: ILoggerRepository,
  ) {}

  static create(repository: ISystemMetadataRepository, logger: ILoggerRepository) {
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
    // get the difference between the new config and the default config
    const partialConfig: DeepPartial<SystemConfig> = {};
    for (const property of getKeysDeep(defaults)) {
      const newValue = _.get(newConfig, property);
      const isEmpty = newValue === undefined || newValue === null || newValue === '';
      const defaultValue = _.get(defaults, property);
      const isEqual = newValue === defaultValue || _.isEqual(newValue, defaultValue);

      if (isEmpty || isEqual) {
        continue;
      }

      _.set(partialConfig, property, newValue);
    }

    await this.repository.set(SystemMetadataKey.SYSTEM_CONFIG, partialConfig);

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
    // load partial
    const partial = this.isUsingConfigFile()
      ? await this.loadFromFile(process.env.IMMICH_CONFIG_FILE as string)
      : await this.repository.get(SystemMetadataKey.SYSTEM_CONFIG);

    // merge with defaults
    const config = _.cloneDeep(defaults);
    for (const property of getKeysDeep(partial)) {
      _.set(config, property, _.get(partial, property));
    }

    // check for extra properties
    const unknownKeys = _.cloneDeep(config);
    for (const property of getKeysDeep(defaults)) {
      unsetDeep(unknownKeys, property);
    }

    if (!_.isEmpty(unknownKeys)) {
      this.logger.warn(`Unknown keys found: ${JSON.stringify(unknownKeys, null, 2)}`);
    }

    // validate full config
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
      return loadYaml(file.toString()) as unknown;
    } catch (error: Error | any) {
      this.logger.error(`Unable to load configuration file: ${filepath}`);
      throw error;
    }
  }
}
