import { AuthDto } from '@app/domain';
import { SharedLinkEntity, UserEntity, UserTokenEntity } from '../../src/infra/entities';

export const adminSignupStub = {
  name: 'Immich Admin',
  email: 'admin@immich.app',
  password: 'Password123',
};

export const userSignupStub = {
  ...adminSignupStub,
  memoriesEnabled: true,
};

export const loginStub = {
  admin: {
    email: 'admin@immich.app',
    password: 'Password123',
  },
};

export const changePasswordStub = {
  password: 'Password123',
  newPassword: 'Password1234',
};

export const authStub = {
  admin: Object.freeze<AuthDto>({
    user: {
      id: 'admin_id',
      email: 'admin@test.com',
      isAdmin: true,
    } as UserEntity,
  }),
  user1: Object.freeze<AuthDto>({
    user: {
      id: 'user-id',
      email: 'immich@test.com',
      isAdmin: false,
    } as UserEntity,
    userToken: {
      id: 'token-id',
    } as UserTokenEntity,
  }),
  user2: Object.freeze<AuthDto>({
    user: {
      id: 'user-2',
      email: 'user2@immich.app',
      isAdmin: false,
    } as UserEntity,
    userToken: {
      id: 'token-id',
    } as UserTokenEntity,
  }),
  external1: Object.freeze<AuthDto>({
    user: {
      id: 'user-id',
      email: 'immich@test.com',
      isAdmin: false,
      externalPath: '/data/user1',
    } as UserEntity,
    userToken: {
      id: 'token-id',
    } as UserTokenEntity,
  }),
  adminSharedLink: Object.freeze<AuthDto>({
    user: {
      id: 'admin_id',
      email: 'admin@test.com',
      isAdmin: true,
    } as UserEntity,
    sharedLink: {
      id: '123',
      showExif: true,
      allowDownload: true,
      allowUpload: true,
      key: Buffer.from('shared-link-key'),
    } as SharedLinkEntity,
  }),
  adminSharedLinkNoExif: Object.freeze<AuthDto>({
    user: {
      id: 'admin_id',
      email: 'admin@test.com',
      isAdmin: true,
    } as UserEntity,
    sharedLink: {
      id: '123',
      showExif: false,
      allowDownload: true,
      allowUpload: true,
      key: Buffer.from('shared-link-key'),
    } as SharedLinkEntity,
  }),
  readonlySharedLink: Object.freeze<AuthDto>({
    user: {
      id: 'admin_id',
      email: 'admin@test.com',
      isAdmin: true,
    } as UserEntity,
    sharedLink: {
      id: '123',
      allowUpload: false,
      allowDownload: false,
      showExif: true,
    } as SharedLinkEntity,
  }),
  passwordSharedLink: Object.freeze<AuthDto>({
    user: {
      id: 'admin_id',
      email: 'admin@test.com',
      isAdmin: true,
    } as UserEntity,
    sharedLink: {
      id: '123',
      allowUpload: false,
      allowDownload: false,
      password: 'password-123',
      showExif: true,
    } as SharedLinkEntity,
  }),
};

export const loginResponseStub = {
  admin: {
    response: {
      accessToken: expect.any(String),
      name: 'Immich Admin',
      isAdmin: true,
      profileImagePath: '',
      shouldChangePassword: true,
      userEmail: 'admin@immich.app',
      userId: expect.any(String),
    },
  },
  user1oauth: {
    response: {
      accessToken: 'cmFuZG9tLWJ5dGVz',
      userId: 'user-id',
      userEmail: 'immich@test.com',
      name: 'immich_name',
      profileImagePath: '',
      isAdmin: false,
      shouldChangePassword: false,
    },
    cookie: [
      'immich_access_token=cmFuZG9tLWJ5dGVz; HttpOnly; Secure; Path=/; Max-Age=34560000; SameSite=Lax;',
      'immich_auth_type=oauth; HttpOnly; Secure; Path=/; Max-Age=34560000; SameSite=Lax;',
      'immich_is_authenticated=true; Secure; Path=/; Max-Age=34560000; SameSite=Lax;',
    ],
  },
  user1password: {
    response: {
      accessToken: 'cmFuZG9tLWJ5dGVz',
      userId: 'user-id',
      userEmail: 'immich@test.com',
      name: 'immich_name',
      profileImagePath: '',
      isAdmin: false,
      shouldChangePassword: false,
    },
    cookie: [
      'immich_access_token=cmFuZG9tLWJ5dGVz; HttpOnly; Secure; Path=/; Max-Age=34560000; SameSite=Lax;',
      'immich_auth_type=password; HttpOnly; Secure; Path=/; Max-Age=34560000; SameSite=Lax;',
      'immich_is_authenticated=true; Secure; Path=/; Max-Age=34560000; SameSite=Lax;',
    ],
  },
  user1insecure: {
    response: {
      accessToken: 'cmFuZG9tLWJ5dGVz',
      userId: 'user-id',
      userEmail: 'immich@test.com',
      name: 'immich_name',
      profileImagePath: '',
      isAdmin: false,
      shouldChangePassword: false,
    },
    cookie: [
      'immich_access_token=cmFuZG9tLWJ5dGVz; HttpOnly; Path=/; Max-Age=34560000; SameSite=Lax;',
      'immich_auth_type=password; HttpOnly; Path=/; Max-Age=34560000; SameSite=Lax;',
      'immich_is_authenticated=true; Path=/; Max-Age=34560000; SameSite=Lax;',
    ],
  },
};
