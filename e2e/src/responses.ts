import { expect } from 'vitest';

export const errorDto = {
  unauthorized: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Authentication required',
  },
  forbidden: {
    error: 'Forbidden',
    statusCode: 403,
    message: expect.any(String),
  },
  wrongPassword: {
    error: 'Bad Request',
    statusCode: 400,
    message: 'Wrong password',
  },
  invalidToken: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Invalid user token',
  },
  invalidShareKey: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Invalid share key',
  },
  invalidSharePassword: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Invalid password',
  },
  badRequest: (message: any = null) => ({
    error: 'Bad Request',
    statusCode: 400,
    message: message ?? expect.anything(),
  }),
  noPermission: {
    error: 'Bad Request',
    statusCode: 400,
    message: expect.stringContaining('Not found or no'),
  },
  incorrectLogin: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Incorrect email or password',
  },
  alreadyHasAdmin: {
    error: 'Bad Request',
    statusCode: 400,
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
