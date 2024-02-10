import { APIKeyEntity } from '@app/infra/entities';
import { authStub } from './auth.stub';
import { userStub } from './user.stub';

export const keyStub = {
  admin: Object.freeze({
    id: 'my-random-guid',
    name: 'My Key',
    key: 'my-api-key (hashed)',
    userId: authStub.admin.user.id,
    user: userStub.admin,
  } as APIKeyEntity),
};

export const apiKeyCreateStub = {
  name: 'API Key',
};
