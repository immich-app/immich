import AsyncLock from 'async-lock';
import { load as loadYaml } from 'js-yaml';
import { cloneDeep, get, isEmpty, isEqual, set } from 'lodash-es';
import { AdminConfigDto, SystemConfig, configFields, defaults } from 'src/dtos/config.dto.js';
import { DatabaseLock, SystemMetadataKey } from 'src/enum.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import type { DeepPartial } from 'src/types.js';
import { unsetDeep } from 'src/utils/misc.js';

type RepoDeps = {
  configRepo: ConfigRepository;
  metadataRepo: SystemMetadataRepository;
  logger: LoggingRepository;
};

const asyncLock = new AsyncLock();
let config: SystemConfig | null = null;
let lastUpdated: number | null = null;

export const clearConfigCache = () => {
  config = null;
  lastUpdated = null;
};

export const getConfig = async (repos: RepoDeps, { withCache }: { withCache: boolean }): Promise<SystemConfig> => {
  if (!withCache || !config) {
    const timestamp = lastUpdated;
    await asyncLock.acquire(DatabaseLock[DatabaseLock.GetSystemConfig], async () => {
      if (timestamp !== lastUpdated) {
        return;
      }

      config = await buildConfig(repos);
      lastUpdated = Date.now();
    });
  }

  return config!;
};

export const updateConfig = async (repos: RepoDeps, newConfig: SystemConfig): Promise<SystemConfig> => {
  const { metadataRepo } = repos;
  // get the difference between the new config and the default config
  const partialConfig: DeepPartial<SystemConfig> = {};
  for (const { key: property } of configFields) {
    const newValue = get(newConfig, property);
    const isEmpty = [undefined, null, ''].includes(newValue);
    const defaultValue = get(defaults, property);
    const equal = newValue === defaultValue || isEqual(newValue, defaultValue);

    if (isEmpty || equal) {
      continue;
    }

    set(partialConfig, property, newValue);
  }

  await metadataRepo.set(SystemMetadataKey.SystemConfig, partialConfig);

  return getConfig(repos, { withCache: false });
};

const loadFromFile = async ({ metadataRepo, logger }: RepoDeps, filepath: string) => {
  try {
    const file = await metadataRepo.readFile(filepath);
    return loadYaml(file) as unknown;
  } catch (error: Error | any) {
    logger.error(`Unable to load configuration file: ${filepath}`);
    logger.error(error);
    throw error;
  }
};

const buildConfig = async (repos: RepoDeps) => {
  const { configRepo, metadataRepo, logger } = repos;
  const { configFile } = configRepo.getEnv();

  const rawConfig = cloneDeep(defaults);

  const databaseConfig = await metadataRepo.get(SystemMetadataKey.SystemConfig);
  const databaseErrors = mergeLayer(repos, rawConfig, databaseConfig, 'database');
  if (databaseErrors.length > 0) {
    logger.warn(['Ignoring invalid database config: ', ...databaseErrors].join('\n'));
  }

  if (configFile) {
    const fileConfig = await loadFromFile(repos, configFile);
    const fileErrors = mergeLayer(repos, rawConfig, fileConfig, 'file');
    if (fileErrors.length > 0) {
      throw new Error(['Invalid system config: ', ...fileErrors].join('\n'));
    }
  }

  const result = AdminConfigDto.schema.safeParse(rawConfig);
  if (!result.success) {
    const messages = ['Invalid system config: ', ...formatIssues(result.error.issues)];
    if (configFile) {
      throw new Error(messages.join('\n'));
    }

    logger.error('Validation error', messages);
  }

  const config = (result.success ? result.data : rawConfig) as SystemConfig;

  if (config.server.externalDomain.length > 0) {
    const domain = new URL(config.server.externalDomain);

    const externalDomain =
      domain.password && domain.username
        ? `${domain.protocol}//${domain.username}:${domain.password}@${domain.host}`
        : domain.origin;

    config.server.externalDomain = externalDomain;
  }

  if (!config.ffmpeg.acceptedVideoCodecs.includes(config.ffmpeg.targetVideoCodec)) {
    config.ffmpeg.acceptedVideoCodecs.push(config.ffmpeg.targetVideoCodec);
  }

  if (!config.ffmpeg.acceptedAudioCodecs.includes(config.ffmpeg.targetAudioCodec)) {
    config.ffmpeg.acceptedAudioCodecs.push(config.ffmpeg.targetAudioCodec);
  }

  return config;
};

const mergeLayer = ({ logger }: RepoDeps, target: SystemConfig, partial: unknown, layer: string) => {
  const unknownKeys = cloneDeep(partial);
  for (const { key } of configFields) {
    unsetDeep(unknownKeys, key);
  }

  if (!isEmpty(unknownKeys)) {
    logger.warn(`Unknown keys found in ${layer} config: ${JSON.stringify(unknownKeys, null, 2)}`);
  }

  const errors: string[] = [];
  for (const { key, schema } of configFields) {
    const value = get(partial, key);
    if (value === undefined) {
      continue;
    }

    const result = schema.safeParse(value);
    if (result.success) {
      set(target, key, result.data);
    } else {
      errors.push(...formatIssues(result.error.issues, [key]));
    }
  }

  return errors;
};

const formatIssues = (issues: { path: PropertyKey[]; message: string }[], prefix: PropertyKey[] = []) =>
  issues.map(({ path, message }) => `  - [${[...prefix, ...path].join('.')}] ${message}`);
