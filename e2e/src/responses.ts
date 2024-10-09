import { expect } from 'vitest';

export const errorDto = {
  unauthorized: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Authentication required',
    correlationId: expect.any(String),
  },
  forbidden: {
    error: 'Forbidden',
    statusCode: 403,
    message: expect.any(String),
    correlationId: expect.any(String),
  },
  missingPermission: (permission: string) => ({
    error: 'Forbidden',
    statusCode: 403,
    message: `Missing required permission: ${permission}`,
    correlationId: expect.any(String),
  }),
  wrongPassword: {
    error: 'Bad Request',
    statusCode: 400,
    message: 'Wrong password',
    correlationId: expect.any(String),
  },
  invalidToken: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Invalid user token',
    correlationId: expect.any(String),
  },
  invalidShareKey: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Invalid share key',
    correlationId: expect.any(String),
  },
  invalidSharePassword: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Invalid password',
    correlationId: expect.any(String),
  },
  badRequest: (message: any = null) => ({
    error: 'Bad Request',
    statusCode: 400,
    message: message ?? expect.anything(),
    correlationId: expect.any(String),
  }),
  noPermission: {
    error: 'Bad Request',
    statusCode: 400,
    message: expect.stringContaining('Not found or no'),
    correlationId: expect.any(String),
  },
  incorrectLogin: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Incorrect email or password',
    correlationId: expect.any(String),
  },
  alreadyHasAdmin: {
    error: 'Bad Request',
    statusCode: 400,
    message: 'The server already has an admin',
    correlationId: expect.any(String),
  },
  invalidEmail: {
    error: 'Bad Request',
    statusCode: 400,
    message: ['email must be an email'],
    correlationId: expect.any(String),
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
    deviceOS: '',
    deviceType: '',
  },
};
