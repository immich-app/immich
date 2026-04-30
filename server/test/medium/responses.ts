import { expect } from 'vitest';

export const errorDto = {
  unauthorized: {
    message: 'Authentication required',
  },
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
  invalidSharePassword: {
    message: 'Invalid password',
  },
  badRequest: (message: any = null) => ({
    message: message ?? expect.anything(),
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
