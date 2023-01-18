import { UserEntity } from '@app/infra';
import { AuthUserDto } from '../src';

export const authStub = {
  admin: Object.freeze<AuthUserDto>({
    id: 'admin_id',
    email: 'admin@test.com',
    isAdmin: true,
    isPublicUser: false,
    isAllowUpload: true,
  }),
  user1: Object.freeze<AuthUserDto>({
    id: 'immich_id',
    email: 'immich@test.com',
    isAdmin: false,
    isPublicUser: false,
    isAllowUpload: true,
  }),
};

export const entityStub = {
  admin: Object.freeze<UserEntity>({
    ...authStub.admin,
    password: 'admin_password',
    firstName: 'admin_first_name',
    lastName: 'admin_last_name',
    oauthId: '',
    shouldChangePassword: false,
    profileImagePath: '',
    createdAt: '2021-01-01',
    tags: [],
  }),
  user1: Object.freeze<UserEntity>({
    ...authStub.user1,
    password: 'immich_password',
    firstName: 'immich_first_name',
    lastName: 'immich_last_name',
    oauthId: '',
    shouldChangePassword: false,
    profileImagePath: '',
    createdAt: '2021-01-01',
    tags: [],
  }),
};
