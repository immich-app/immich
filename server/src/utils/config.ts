import AsyncLock from 'async-lock';
import { load as loadYaml } from 'js-yaml';
import { cloneDeep, get, isEmpty, isEqual, set, snakeCase } from 'lodash-es';
import { CONFIG_ENV_PREFIX } from 'src/constants.js';
import { AdminConfigDto, SystemConfig, configFields, defaults } from 'src/dtos/config.dto.js';
import { ConfigSource, DatabaseLock, SystemMetadataKey } from 'src/enum.js';
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

type ConfigField = { sources: { source: ConfigSource; value: unknown }[] };

type ResolvedConfig = { config: SystemConfig; fields: Record<string, ConfigField> };

const asyncLock = new AsyncLock();
let resolved: ResolvedConfig | null = null;
let lastUpdated: number | null = null;

export const clearConfigCache = () => {
  resolved = null;
  lastUpdated = null;
};

export const getConfig = async (repos: RepoDeps, options: { withCache: boolean }): Promise<SystemConfig> => {
  const { config } = await getResolvedConfig(repos, options);
  return config;
};

export const getResolvedConfig = async (
  repos: RepoDeps,
  { withCache }: { withCache: boolean },
): Promise<ResolvedConfig> => {
  if (!withCache || !resolved) {
    const timestamp = lastUpdated;
    await asyncLock.acquire(DatabaseLock[DatabaseLock.GetSystemConfig], async () => {
      if (timestamp !== lastUpdated) {
        return;
      }

      resolved = await buildConfig(repos);
      lastUpdated = Date.now();
    });
  }

  return resolved!;
};

export const isLocked = ({ sources }: ConfigField) =>
  ![ConfigSource.Default, ConfigSource.Database].includes(sources.at(-1)!.source);

export const updateConfig = async (repos: RepoDeps, newConfig: SystemConfig): Promise<SystemConfig> => {
  const { metadataRepo } = repos;
  const { fields } = await getResolvedConfig(repos, { withCache: false });
  // get the difference between the new config and the default config
  const partialConfig: DeepPartial<SystemConfig> = {};
  for (const { key: property } of configFields) {
    if (isLocked(fields[property])) {
      const database = fields[property].sources.find(({ source }) => source === ConfigSource.Database);
      if (database) {
        set(partialConfig, property, database.value);
      }

      continue;
    }

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
  const { configFile, configOverrides } = configRepo.getEnv();

  const rawConfig = cloneDeep(defaults);
  const fields = Object.fromEntries(
    configFields.map(({ key }) => [key, { sources: [{ source: ConfigSource.Default, value: get(defaults, key) }] }]),
  );

  const databaseConfig = await metadataRepo.get(SystemMetadataKey.SystemConfig);
  const databaseErrors = mergeLayer(repos, rawConfig, fields, databaseConfig, ConfigSource.Database);
  if (databaseErrors.length > 0) {
    logger.warn(['Ignoring invalid database config: ', ...databaseErrors].join('\n'));
  }

  if (configFile) {
    const fileConfig = await loadFromFile(repos, configFile);
    const fileErrors = mergeLayer(repos, rawConfig, fields, fileConfig, ConfigSource.File);
    if (fileErrors.length > 0) {
      throw new Error(['Invalid system config: ', ...fileErrors].join('\n'));
    }
  }

  const { envConfig, envErrors } = decodeEnv(repos, configOverrides);
  if (envErrors.length > 0) {
    throw new Error(['Invalid system config: ', ...envErrors].join('\n'));
  }

  mergeLayer(repos, rawConfig, fields, envConfig, ConfigSource.Env);

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

  return { config, fields };
};

const mergeLayer = (
  { logger }: RepoDeps,
  target: SystemConfig,
  fields: Record<string, ConfigField>,
  partial: unknown,
  layer: ConfigSource,
) => {
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
      fields[key].sources.push({ source: layer, value: result.data });
    } else {
      errors.push(...formatIssues(result.error.issues, [key]));
    }
  }

  return errors;
};

const decodeEnv = ({ logger }: RepoDeps, configOverrides: Record<string, string>) => {
  const envConfig = {};
  const envErrors: string[] = [];
  const unknownVariables = new Set(Object.keys(configOverrides));

  for (const { key, schema } of configFields) {
    const variable = `${CONFIG_ENV_PREFIX}${snakeCase(key).toUpperCase()}`;
    const value = configOverrides[variable];
    unknownVariables.delete(variable);
    if (value === undefined) {
      continue;
    }

    const candidate = getEnvCandidates(value).find((candidate) => schema.safeParse(candidate).success);
    if (candidate === undefined) {
      envErrors.push(...formatIssues(schema.safeParse(value).error!.issues, [variable]));
      continue;
    }

    set(envConfig, key, candidate);
  }

  for (const variable of unknownVariables) {
    logger.warn(`Unknown configuration environment variable: ${variable}`);
  }

  return { envConfig, envErrors };
};

const getEnvCandidates = (value: string): unknown[] => [
  value,
  ...parseJson(value),
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
];

const parseJson = (value: string) => {
  try {
    return [JSON.parse(value)];
  } catch {
    return [];
  }
};

const formatIssues = (issues: { path: PropertyKey[]; message: string }[], prefix: PropertyKey[] = []) =>
  issues.map(({ path, message }) => `  - [${[...prefix, ...path].join('.')}] ${message}`);
