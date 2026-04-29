import { expect } from 'vitest';

export const errorDto = {
  unauthorized: {
    message: 'Authentication required',
  },
  forbidden: {
    message: expect.any(String),
  },
  missingPermission: {
    message: 'Access denied',
  },
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
    message: 'Access denied',
  },
  incorrectLogin: {
    message: 'Incorrect email or password',
  },
  alreadyHasAdmin: {
    message: 'The server already has an admin',
  },
};
