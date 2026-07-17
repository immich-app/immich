import { expect } from 'vitest';

export const errorDto = {
  unauthorized: {
    message: 'Authentication required',
  },
  unauthorizedWithMessage: (message: string) => ({
    message,
  }),
  forbidden: {
    message: expect.any(String),
  },
  missingPermission: (permission: string) => ({
    message: `Missing required permission: ${permission}`,
  }),
  wrongPassword: {
    message: 'Wrong password',
  },
  invalidToken: {
    message: 'Invalid user token',
  },
  invalidShareKey: {
    message: 'Invalid share key',
  },
  passwordRequired: {
    message: 'Password required',
  },
  badRequest: (message: any = null) => ({
    message: message ?? expect.anything(),
  }),
  validationError: (errors?: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>) => ({
    message: 'Validation failed',
    errors: errors ? expect.arrayContaining(errors.map((e) => expect.objectContaining(e))) : expect.any(Array),
  }),
  noPermission: {
    message: expect.stringContaining('Not found or no'),
  },
  incorrectLogin: {
    message: 'Incorrect email or password',
  },
  alreadyHasAdmin: {
    message: 'The server already has an admin',
  },
};

export const signupResponseDto = {
  admin: {
    avatarColor: expect.any(String),
    id: expect.any(String),
    name: 'Immich Admin',
    email: 'admin@immich.cloud',
    storageLabel: 'admin',
    profileImagePath: '',
    // why? lol
    shouldChangePassword: true,
    isAdmin: true,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
    oauthId: '',
    quotaUsageInBytes: 0,
    quotaSizeInBytes: null,
    status: 'active',
    license: null,
    profileChangedAt: expect.any(String),
  },
};

export const loginResponseDto = {
  admin: {
    accessToken: expect.any(String),
    name: 'Immich Admin',
    isAdmin: true,
    isOnboarded: false,
    profileImagePath: '',
    shouldChangePassword: true,
    userEmail: 'admin@immich.cloud',
    userId: expect.any(String),
  },
};
export const deviceDto = {
  current: {
    id: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    current: true,
    isPendingSyncReset: false,
    deviceOS: '',
    deviceType: '',
    appVersion: null,
  },
};
