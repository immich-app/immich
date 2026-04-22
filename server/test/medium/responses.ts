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
};
