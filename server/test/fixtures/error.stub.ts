export const errorStub = {
  badRequest: {
    error: 'Bad Request',
    statusCode: 400,
    message: expect.any(Array),
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
