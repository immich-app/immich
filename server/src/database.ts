import { Permission, UserStatus } from 'src/enum';

export type AuthUser = {
  id: string;
  isAdmin: boolean;
  name: string;
  email: string;
};

export type AuthApiKey = {
  id: string;
  permissions: Permission[];
};

export type ApiKey = {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: Permission[];
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type UserAdmin = User & {
  shouldChangePassword: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  status: UserStatus;
};

export type AuthSession = {
  id: string;
  hasElevatedPermission: boolean;
};

export type Session = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  deviceOS: string;
  deviceType: string;
  appVersion: string | null;
  pinExpiresAt: Date | null;
  isPendingSyncReset: boolean;
};

const userColumns = ['id', 'name', 'email'] as const;

export const columns = {
  authUser: ['user.id', 'user.name', 'user.email', 'user.isAdmin'],
  authApiKey: ['api_key.id', 'api_key.permissions'],
  authSession: ['session.id', 'session.updatedAt', 'session.pinExpiresAt', 'session.appVersion'],
  user: userColumns,
  userAdmin: [
    ...userColumns,
    'createdAt',
    'updatedAt',
    'deletedAt',
    'isAdmin',
    'status',
    'shouldChangePassword',
  ],
  apiKey: ['id', 'name', 'userId', 'createdAt', 'updatedAt', 'permissions'],
} as const;
