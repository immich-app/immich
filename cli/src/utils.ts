import { getMyUserInfo, init, isHttpError } from '@immich/sdk';
import { glob } from 'fast-glob';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import yaml from 'yaml';

export interface BaseOptions {
  configDirectory: string;
  key?: string;
  url?: string;
}

export type AuthDto = { url: string; key: string };
type OldAuthDto = { instanceUrl: string; apiKey: string };

export const authenticate = async (options: BaseOptions): Promise<AuthDto> => {
  const { configDirectory: configDir, url, key } = options;

  // provided in command
  if (url && key) {
    return connect(url, key);
  }

  // fallback to auth file
  const config = await readAuthFile(configDir);
  const auth = await connect(config.url, config.key);
  if (auth.url !== config.url) {
    await writeAuthFile(configDir, auth);
  }

  return auth;
};

export const connect = async (url: string, key: string) => {
  const wellKnownUrl = new URL('.well-known/immich', url);
  try {
    const wellKnown = await fetch(wellKnownUrl).then((response) => response.json());
    const endpoint = new URL(wellKnown.api.endpoint, url).toString();
    if (endpoint !== url) {
      console.debug(`Discovered API at ${endpoint}`);
    }
    url = endpoint;
  } catch {
    // noop
  }

  init({ baseUrl: url, apiKey: key });

  const [error] = await withError(getMyUserInfo());
  if (isHttpError(error)) {
    logError(error, 'Failed to connect to server');
    process.exit(1);
  }

  return { url, key };
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
    const auth = yaml.parse(data.toString()) as AuthDto | OldAuthDto;
    const { instanceUrl, apiKey } = auth as OldAuthDto;
    if (instanceUrl && apiKey) {
      return { url: instanceUrl, key: apiKey };
    }
    return auth as AuthDto;
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

export interface CrawlOptions {
  pathsToCrawl: string[];
  recursive?: boolean;
  includeHidden?: boolean;
  exclusionPattern?: string;
  extensions: string[];
}
export const crawl = async (options: CrawlOptions): Promise<string[]> => {
  const { extensions: extensionsWithPeriod, recursive, pathsToCrawl, exclusionPattern, includeHidden } = options;
  const extensions = extensionsWithPeriod.map((extension) => extension.replace('.', ''));

  if (pathsToCrawl.length === 0) {
    return [];
  }

  const patterns: string[] = [];
  const crawledFiles: string[] = [];

  for await (const currentPath of pathsToCrawl) {
    try {
      const absolutePath = resolve(currentPath);
      const stats = await stat(absolutePath);
      if (stats.isFile() || stats.isSymbolicLink()) {
        crawledFiles.push(absolutePath);
      } else {
        patterns.push(absolutePath);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        patterns.push(currentPath);
      } else {
        throw error;
      }
    }
  }

  let searchPattern: string;
  if (patterns.length === 1) {
    searchPattern = patterns[0];
  } else if (patterns.length === 0) {
    return crawledFiles;
  } else {
    searchPattern = '{' + patterns.join(',') + '}';
  }

  if (recursive) {
    searchPattern = searchPattern + '/**/';
  }

  searchPattern = `${searchPattern}/*.{${extensions.join(',')}}`;

  const globbedFiles = await glob(searchPattern, {
    absolute: true,
    caseSensitiveMatch: false,
    onlyFiles: true,
    dot: includeHidden,
    ignore: [`**/${exclusionPattern}`],
  });
  globbedFiles.push(...crawledFiles);
  return globbedFiles.sort();
};

export const sha1 = (filepath: string) => {
  const hash = createHash('sha1');
  return new Promise<string>((resolve, reject) => {
    const rs = createReadStream(filepath);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
};
