import { APIKeyEntity } from 'src/entities/api-key.entity';
import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';

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
