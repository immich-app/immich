export const errorStub = {
  unauthorized: {
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Authentication required',
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
  badRequest: (message: any) => ({
    error: 'Bad Request',
    statusCode: 400,
    message: message,
  }),
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
  noDeleteUploadLibrary: {
    error: 'Bad Request',
    statusCode: 400,
    message: 'Cannot delete the last upload library',
  },
};
