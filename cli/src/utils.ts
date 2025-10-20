import { getMyUser, init, isHttpError } from '@immich/sdk';
import SQLite from 'better-sqlite3';
import { convertPathToPattern, glob } from 'fast-glob';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { platform } from 'node:os';
import path, { join, resolve } from 'node:path';
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

  const [error] = await withError(getMyUser());
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

const convertPathToPatternOnWin = (path: string) => {
  return platform() === 'win32' ? convertPathToPattern(path) : path;
};

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
        patterns.push(convertPathToPatternOnWin(absolutePath));
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        patterns.push(convertPathToPatternOnWin(currentPath));
      } else {
        throw error;
      }
    }
  }

  if (patterns.length === 0) {
    return crawledFiles;
  }

  const searchPatterns = patterns.map((pattern) => {
    let escapedPattern = pattern.replaceAll("'", "[']").replaceAll('"', '["]').replaceAll('`', '[`]');
    if (recursive) {
      escapedPattern = escapedPattern + '/**';
    }
    return `${escapedPattern}/*.{${extensions.join(',')}}`;
  });

  const globbedFiles = await glob(searchPatterns, {
    absolute: true,
    caseSensitiveMatch: false,
    dot: includeHidden,
    ignore: [`**/${exclusionPattern}`],
  });
  globbedFiles.push(...crawledFiles);
  return globbedFiles.sort();
};

export const sha1 = (filepath: string) => {
  const hash = createHash('sha1');
  return new Promise<Buffer>((resolve, reject) => {
    const rs = createReadStream(filepath);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest()));
  });
};

/**
 * Batches items and calls onBatch to process them
 * when the batch size is reached or the debounce time has passed.
 */
export class Batcher<T = unknown> {
  private items: T[] = [];
  private readonly batchSize: number;
  private readonly debounceTimeMs?: number;
  private readonly onBatch: (items: T[]) => void;
  private debounceTimer?: NodeJS.Timeout;

  constructor({
    batchSize,
    debounceTimeMs,
    onBatch,
  }: {
    batchSize: number;
    debounceTimeMs?: number;
    onBatch: (items: T[]) => Promise<void>;
  }) {
    this.batchSize = batchSize;
    this.debounceTimeMs = debounceTimeMs;
    this.onBatch = onBatch;
  }

  private setDebounceTimer() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.debounceTimeMs) {
      this.debounceTimer = setTimeout(() => this.flush(), this.debounceTimeMs);
    }
  }

  private clearDebounceTimer() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  add(item: T) {
    this.items.push(item);
    this.setDebounceTimer();
    if (this.items.length >= this.batchSize) {
      this.flush();
    }
  }

  flush() {
    this.clearDebounceTimer();
    if (this.items.length === 0) {
      return;
    }

    this.onBatch(this.items);

    this.items = [];
  }
}

export class FileHashCache {
  private db: SQLite.Database;
  private getFile: SQLite.Statement<[string, string], { hash: Buffer; mtime: number; size: number }>;
  private insertFolder: SQLite.Statement<[string], void>;
  private upsertFile: SQLite.Statement<[string, string, Buffer, number, number], void>;

  constructor(configDir: string) {
    this.db = this.startDatabase(join(configDir, 'cli.db'));
    this.getFile = this.db.prepare(
      'SELECT hash, mtime, size FROM file WHERE name = ? AND folder_id = (SELECT id FROM folder WHERE path = ?)',
    );
    this.insertFolder = this.db.prepare('INSERT INTO folder (path) VALUES (?) ON CONFLICT (path) DO NOTHING');
    this.upsertFile = this.db.prepare(`
      INSERT INTO file (name, folder_id, hash, mtime, size)
      VALUES (?, (SELECT id FROM folder WHERE path = ?), ?, ?, ?)
      ON CONFLICT (name, folder_id) DO UPDATE SET hash = excluded.hash, mtime = excluded.mtime, size = excluded.size`);
  }

  get(filepath: string, mtimeMs: number, size: number) {
    const parsed = path.parse(filepath);
    const entry = this.getFile.get(parsed.base, parsed.dir);
    if (entry && entry.mtime === mtimeMs && entry.size === size) {
      return entry.hash.toString('hex');
    }
  }

  async compute(filepath: string, mtimeMs: number, size: number) {
    const hash = await sha1(filepath);
    const parsed = path.parse(filepath);
    try {
      this.upsertFile.run(parsed.base, parsed.dir, hash, mtimeMs, size);
    } catch (error: any) {
      if (error.message.endsWith('file.folder_id')) {
        this.insertFolder.run(parsed.dir);
        this.upsertFile.run(parsed.base, parsed.dir, hash, mtimeMs, size);
      }
    }
    return hash.toString('hex');
  }

  close() {
    this.db.close();
  }

  private startDatabase(path: string) {
    const db = new SQLite(path);
    const cliVersion = migrations.length;
    const dbVersion = this.getVersion(db);
    if (dbVersion === 0) {
      db.exec(
        `PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS schema_version (id INTEGER PRIMARY KEY, created_at INTEGER NOT NULL DEFAULT (unixepoch())) STRICT`,
      );
    } else if (dbVersion > cliVersion) {
      throw new Error(`DB schema is too new (expected ${cliVersion}, got ${dbVersion}). Please update the CLI.`);
    }

    if (dbVersion < cliVersion) {
      const insertVersion = db.prepare('INSERT INTO schema_version (id) VALUES (?)');
      for (let i = dbVersion; i < cliVersion; i++) {
        const migrate = migrations[i];
        db.exec('BEGIN');
        migrate(db);
        db.exec('COMMIT');
        insertVersion.run(i + 1);
      }
    }
    return db;
  }

  private getVersion(db: SQLite.Database) {
    try {
      return db.prepare<[], { id: number }>('SELECT max(id) id FROM schema_version').get()?.id ?? 0;
    } catch (error: any) {
      if (error.message !== 'no such table: schema_version') {
        throw error;
      }
      return 0;
    }
  }
}

// this database is just a simple cache, but it's versioned to have more options for schema changes if it comes up,
// as well as to avoid potential issues when downgrading the CLI
const migrations = [
  (db: SQLite.Database) =>
    db.exec(`CREATE TABLE IF NOT EXISTS folder (id INTEGER PRIMARY KEY, path TEXT UNIQUE NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS file (
  name TEXT NOT NULL,
  folder_id INTEGER NOT NULL,
  hash BLOB NOT NULL,
  mtime INTEGER NOT NULL,
  size INTEGER NOT NULL,
  FOREIGN KEY (folder_id) REFERENCES folder (id) ON DELETE CASCADE,
  PRIMARY KEY (name, folder_id)
) STRICT, WITHOUT ROWID;`),
];