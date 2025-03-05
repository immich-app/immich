import { OAuthRepository } from 'src/repositories/oauth.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked } from 'vitest';

export const newOAuthRepositoryMock = (): Mocked<RepositoryInterface<OAuthRepository>> => {
  return {
    init: vitest.fn(),
    authorize: vitest.fn(),
    getLogoutEndpoint: vitest.fn(),
    getProfile: vitest.fn(),
  };
};
