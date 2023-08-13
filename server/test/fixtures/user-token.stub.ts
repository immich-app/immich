import { UserTokenEntity } from '@app/infra/entities';
import { userStub } from './user.stub';

export const userTokenStub = {
  userToken: Object.freeze<UserTokenEntity>({
    id: 'token-id',
    token: 'auth_token',
    userId: userStub.user1.id,
    user: userStub.user1,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date(),
    deviceType: '',
    deviceOS: '',
  }),
  inactiveToken: Object.freeze<UserTokenEntity>({
    id: 'not_active',
    token: 'auth_token',
    userId: userStub.user1.id,
    user: userStub.user1,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deviceType: 'Mobile',
    deviceOS: 'Android',
  }),
};
