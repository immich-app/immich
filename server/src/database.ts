import { sql } from 'kysely';
import { Permission } from 'src/enum';

export type AuthUser = {
  id: string;
  isAdmin: boolean;
  name: string;
  email: string;
  quotaUsageInBytes: number;
  quotaSizeInBytes: number | null;
};

export type AuthApiKey = {
  id: string;
  permissions: Permission[];
};

export type AuthSharedLink = {
  id: string;
  expiresAt: Date | null;
  userId: string;
  showExif: boolean;
  allowUpload: boolean;
  allowDownload: boolean;
  password: string | null;
};

export type AuthSession = {
  id: string;
};

export const columns = {
  ackEpoch: (columnName: 'createdAt' | 'updatedAt' | 'deletedAt') =>
    sql.raw<string>(`extract(epoch from "${columnName}")::text`).as('ackEpoch'),
  authUser: [
    'users.id',
    'users.name',
    'users.email',
    'users.isAdmin',
    'users.quotaUsageInBytes',
    'users.quotaSizeInBytes',
  ],
  authApiKey: ['api_keys.id', 'api_keys.permissions'],
  authSession: ['sessions.id', 'sessions.updatedAt'],
  authSharedLink: [
    'shared_links.id',
    'shared_links.userId',
    'shared_links.expiresAt',
    'shared_links.showExif',
    'shared_links.allowUpload',
    'shared_links.allowDownload',
    'shared_links.password',
  ],
  userDto: ['id', 'name', 'email', 'profileImagePath', 'profileChangedAt'],
  apiKey: ['id', 'name', 'userId', 'createdAt', 'updatedAt', 'permissions'],
} as const;
