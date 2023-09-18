export const errorStub = {
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
  badRequest: {
    error: 'Bad Request',
    statusCode: 400,
    message: expect.any(Array),
  },
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
