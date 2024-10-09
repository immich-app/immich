import { IOAuthRepository } from 'src/interfaces/oauth.interface';
import { Mocked } from 'vitest';

export const newOAuthRepositoryMock = (): Mocked<IOAuthRepository> => {
  return {
    init: vitest.fn(),
    authorize: vitest.fn(),
    getLogoutEndpoint: vitest.fn(),
    getProfile: vitest.fn(),
  };
};
