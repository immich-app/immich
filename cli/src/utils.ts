import { defaults, getMyUserInfo, isHttpError } from '@immich/sdk';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'yaml';

export interface BaseOptions {
  configDirectory: string;
  apiKey?: string;
  instanceUrl?: string;
}

export interface AuthDto {
  instanceUrl: string;
  apiKey: string;
}

export const authenticate = async (options: BaseOptions): Promise<void> => {
  const { configDirectory: configDir, instanceUrl, apiKey } = options;

  // provided in command
  if (instanceUrl && apiKey) {
    await connect(instanceUrl, apiKey);
  }

  // fallback to file
  const config = await readAuthFile(configDir);
  await connect(config.instanceUrl, config.apiKey);
};

export const connect = async (instanceUrl: string, apiKey: string): Promise<void> => {
  const wellKnownUrl = new URL('.well-known/immich', instanceUrl);
  try {
    const wellKnown = await fetch(wellKnownUrl).then((response) => response.json());
    const endpoint = new URL(wellKnown.api.endpoint, instanceUrl).toString();
    if (endpoint !== instanceUrl) {
      console.debug(`Discovered API at ${endpoint}`);
    }
    instanceUrl = endpoint;
  } catch {
    // noop
  }

  defaults.baseUrl = instanceUrl;
  defaults.headers = { 'x-api-key': apiKey };

  const [error] = await withError(getMyUserInfo());
  if (isHttpError(error)) {
    logError(error, 'Failed to connect to server');
    process.exit(1);
  }
};

export const logError = (error: unknown, message: string) => {
  if (isHttpError(error)) {
    console.error(`${message}: ${error.status}`);
    console.error(JSON.stringify(error.data, undefined, 2));
  } else {
    console.error(`${message} - ${error}`);
  }
};

export const getAuthFilePath = (dir: string) => join(dir, 'auth.yml');

export const readAuthFile = async (dir: string) => {
  try {
    const data = await readFile(getAuthFilePath(dir));
    // TODO add class-transform/validation
    return yaml.parse(data.toString()) as AuthDto;
  } catch (error: Error | any) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      console.log('No auth file exists. Please login first.');
      process.exit(1);
    }
    throw error;
  }
};

export const writeAuthFile = async (dir: string, auth: AuthDto) =>
  writeFile(getAuthFilePath(dir), yaml.stringify(auth), { mode: 0o600 });

export const withError = async <T>(promise: Promise<T>): Promise<[Error, undefined] | [undefined, T]> => {
  try {
    const result = await promise;
    return [undefined, result];
  } catch (error: Error | any) {
    return [error, undefined];
  }
};
