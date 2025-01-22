import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';

export const keyStub = {
  authKey: Object.freeze({
    id: 'my-random-guid',
    key: 'my-api-key (hashed)',
    user: userStub.admin,
    permissions: [],
  } as any),

  admin: Object.freeze({
    id: 'my-random-guid',
    name: 'My Key',
    key: 'my-api-key (hashed)',
    userId: authStub.admin.user.id,
    user: userStub.admin,
    permissions: [],
  } as any),
};
