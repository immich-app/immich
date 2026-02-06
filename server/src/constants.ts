import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SemVer } from 'semver';
import { ApiTag, DatabaseExtension } from 'src/enum';

export const POSTGRES_VERSION_RANGE = '>=14.0.0';
export const VECTOR_VERSION_RANGE = '>=0.5 <1';

export const EXTENSION_NAMES: Record<DatabaseExtension, string> = {
  vector: 'pgvector',
} as const;

export const VECTOR_EXTENSIONS = [DatabaseExtension.Vector] as const;

export const SALT_ROUNDS = 10;

export const IWorker = 'IWorker';

// eslint-disable-next-line unicorn/prefer-module
const basePath = dirname(__filename);
const packageFile = join(basePath, '..', 'package.json');
const { version } = JSON.parse(readFileSync(packageFile, 'utf8'));
export const serverVersion = new SemVer(version);

export const LOGIN_URL = '/auth/login?autoLaunch=0';

export const excludePaths = ['/.well-known/immich', '/custom.css', '/favicon.ico'];

export const endpointTags: Record<ApiTag, string> = {
  [ApiTag.ApiKeys]: 'An API key can be used to programmatically access the API.',
  [ApiTag.Authentication]: 'Endpoints related to user authentication.',
  [ApiTag.Server]: 'Information about the current server deployment, including version, features, and health.',
  [ApiTag.Sessions]: 'A session represents an authenticated login session for a user.',
  [ApiTag.Users]: 'Endpoints for viewing and updating the current user.',
};
