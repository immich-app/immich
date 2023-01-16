import { UserEntity } from '@app/infra';
import { AuthUserDto } from '../src';

export const ADMIN_AUTH_DTO = Object.freeze({
  id: 'admin_id',
  email: 'admin@test.com',
  isAdmin: true,
  isPublicUser: false,
  isAllowUpload: true,
} as AuthUserDto);

export const USER1_AUTH_DTO = Object.freeze({
  id: 'immich_id',
  email: 'immich@test.com',
  isAdmin: false,
  isPublicUser: false,
  isAllowUpload: true,
} as AuthUserDto);

export const ADMIN_ENTITY: UserEntity = Object.freeze({
  ...ADMIN_AUTH_DTO,
  password: 'admin_password',
  firstName: 'admin_first_name',
  lastName: 'admin_last_name',
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: '2021-01-01',
  tags: [],
});

export const USER1_ENTITY: UserEntity = Object.freeze({
  ...USER1_AUTH_DTO,
  password: 'immich_password',
  firstName: 'immich_first_name',
  lastName: 'immich_last_name',
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: '2021-01-01',
  tags: [],
});
