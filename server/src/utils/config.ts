import AsyncLock from 'async-lock';
import * as _ from 'lodash';
import { SystemConfig, defaults } from 'src/config';
import { DatabaseLock, SystemMetadataKey } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DeepPartial } from 'src/types';

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

export const getConfig = async (
  repos: RepoDeps,
  options: { withCache?: boolean; withRecordEnabled?: boolean } = {},
): Promise<SystemConfig> => {
  const { withCache = true } = options;

  if (withCache && config) {
    return config;
  }

  return asyncLock.acquire('getConfig', async () => {
    if (withCache && config) {
      return config;
    }

    const stored = await repos.metadataRepo.get(SystemMetadataKey.SystemConfig);
    const result = _.defaultsDeep(stored || {}, defaults) as SystemConfig;
    config = result;
    lastUpdated = Date.now();
    return result;
  });
};

export const updateConfig = async (repos: RepoDeps, newConfig: SystemConfig): Promise<SystemConfig> => {
  await repos.metadataRepo.set(SystemMetadataKey.SystemConfig, newConfig);
  config = newConfig;
  lastUpdated = Date.now();
  return newConfig;
};
