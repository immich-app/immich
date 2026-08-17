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
