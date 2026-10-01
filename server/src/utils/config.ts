import { BadRequestException } from '@nestjs/common';
import AsyncLock from 'async-lock';
import { load as loadYaml } from 'js-yaml';
import { cloneDeep, get, isEmpty, isEqual, set, snakeCase } from 'lodash-es';
import type { DeepPartial } from 'src/types.js';
import { AdminConfigDto, AdminConfigField, SystemConfig, defaults } from 'src/dtos/config.dto.js';
import { ConfigSource, DatabaseLock, SystemMetadataKey } from 'src/enum.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { getKeysDeep, unsetDeep } from 'src/utils/misc.js';

type RepoDeps = {
  configRepo: ConfigRepository;
  metadataRepo: SystemMetadataRepository;
  logger: LoggingRepository;
};

type OverrideSource = Exclude<ConfigSource, ConfigSource.Default>;
type Layer = { source: OverrideSource; data: unknown };

type ConfigFields = Record<string, AdminConfigField>;
type ResolvedConfig = { config: SystemConfig; fields: ConfigFields };

const CONFIG_ENV_PREFIX = 'IMMICH_CONFIG_';

const asyncLock = new AsyncLock();
let resolved: ResolvedConfig | null = null;
let lastUpdated: number | null = null;

export const clearConfigCache = () => {
  resolved = null;
  lastUpdated = null;
};

const toConfigEnvVariable = (property: string) => CONFIG_ENV_PREFIX + snakeCase(property).toUpperCase();

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

export const getConfig = async (repos: RepoDeps, options: { withCache: boolean }): Promise<SystemConfig> => {
  const { config } = await getResolvedConfig(repos, options);
  return config;
};

export const updateConfig = async (repos: RepoDeps, newConfig: SystemConfig): Promise<SystemConfig> => {
  const { metadataRepo } = repos;
  const { fields } = await getResolvedConfig(repos, { withCache: false });

  // get the difference between the new config and the default config
  const partialConfig: DeepPartial<SystemConfig> = {};
  const writeErrors: string[] = [];
  for (const property of getKeysDeep(defaults)) {
    const field = fields[property];
    const newValue = get(newConfig, property);

    if (!field.isEditable) {
      if (!isEqual(newValue, field.value)) {
        const { source } = field.sources.at(-1)!;
        const origin = source === ConfigSource.Env ? `environment variable ${field.envName}` : 'config file';
        writeErrors.push(`${property} (${origin})`);
      }
      continue;
    }

    const isEmpty = [undefined, null, ''].includes(newValue);
    const defaultValue = get(defaults, property);
    const equal = newValue === defaultValue || isEqual(newValue, defaultValue);

    if (isEmpty || equal) {
      continue;
    }

    set(partialConfig, property, newValue);
  }

  if (writeErrors.length > 0) {
    throw new BadRequestException(
      `Cannot update properties that are set via config file or environment variables: ${writeErrors.join(', ')}`,
    );
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

const normalizeEnvValue = (property: string, value: string): unknown => {
  if (!Array.isArray(get(defaults, property))) {
    return value;
  }

  if (value.trimStart().startsWith('[')) {
    return JSON.parse(value) as unknown[];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const loadFromEnv = ({ logger }: RepoDeps, overrides: Record<string, string>) => {
  const partial: DeepPartial<SystemConfig> = {};
  const known = new Set<string>();

  for (const property of getKeysDeep(defaults)) {
    const name = toConfigEnvVariable(property);
    known.add(name);

    const value = overrides[name];
    if (value !== undefined) {
      set(partial, property, normalizeEnvValue(property, value));
    }
  }

  for (const name of Object.keys(overrides)) {
    if (!known.has(name)) {
      logger.warn(`Unknown configuration environment variable: ${name}`);
    }
  }

  return partial;
};

const findField = (fields: ConfigFields, path: PropertyKey[]) => {
  const segments = path.map(String);
  while (segments.length > 0) {
    const field = fields[segments.join('.')];
    if (field) {
      return field;
    }
    segments.pop();
  }
};

const buildConfig = async (repos: RepoDeps): Promise<ResolvedConfig> => {
  const { configRepo, metadataRepo, logger } = repos;
  const { configFile, configOverrides } = configRepo.getEnv();

  const layers: Layer[] = [
    { source: ConfigSource.Database, data: (await metadataRepo.get(SystemMetadataKey.SystemConfig)) ?? {} },
  ];
  if (configFile) {
    layers.push({ source: ConfigSource.File, data: await loadFromFile(repos, configFile) });
  }
  layers.push({ source: ConfigSource.Env, data: loadFromEnv(repos, configOverrides) });

  // check for extra properties
  for (const { source, data } of layers) {
    const unknownKeys = cloneDeep(data);
    for (const property of getKeysDeep(defaults)) {
      unsetDeep(unknownKeys, property);
    }

    if (!isEmpty(unknownKeys)) {
      logger.warn(`Unknown keys found in ${source} config: ${JSON.stringify(unknownKeys, null, 2)}`);
    }
  }

  // merge with defaults
  const rawConfig = cloneDeep(defaults);
  const fields: ConfigFields = {};
  for (const property of getKeysDeep(defaults)) {
    const field: AdminConfigField = {
      key: property,
      envName: toConfigEnvVariable(property),
      value: get(defaults, property),
      sources: [{ source: ConfigSource.Default, value: get(defaults, property) }],
      isEditable: true,
    };

    for (const { source, data } of layers) {
      const value = get(data, property);
      if (value === undefined) {
        continue;
      }

      field.sources.push({ source, value });
      field.value = value;
      set(rawConfig, property, value);

      if (source === ConfigSource.File || source === ConfigSource.Env) {
        field.isEditable = false;
      }
    }

    fields[property] = field;
  }

  // validate with Zod schema
  const result = AdminConfigDto.schema.safeParse(rawConfig);
  if (!result.success) {
    const messages = ['Invalid system config: '];
    let fatal = false;
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      messages.push(`  - [${path}] ${issue.message}`);

      const field = findField(fields, issue.path);
      if (field && !field.isEditable) {
        fatal = true;
      }
    }

    if (fatal || configFile) {
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

  for (const [property, field] of Object.entries(fields)) {
    field.value = get(config, property);
  }

  return { config, fields };
};
