import { AuthDto } from 'src/dtos/auth.dto';
import { SessionEntity } from 'src/entities/session.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { UserEntity } from 'src/entities/user.entity';

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
    session: {
      id: 'token-id',
    } as SessionEntity,
  }),
  user2: Object.freeze<AuthDto>({
    user: {
      id: 'user-2',
      email: 'user2@immich.app',
      isAdmin: false,
    } as UserEntity,
    session: {
      id: 'token-id',
    } as SessionEntity,
  }),
  external1: Object.freeze<AuthDto>({
    user: {
      id: 'user-id',
      email: 'immich@test.com',
      isAdmin: false,
    } as UserEntity,
    session: {
      id: 'token-id',
    } as SessionEntity,
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
    accessToken: 'cmFuZG9tLWJ5dGVz',
    userId: 'user-id',
    userEmail: 'immich@test.com',
    name: 'immich_name',
    profileImagePath: '',
    isAdmin: false,
    shouldChangePassword: false,
  },
  user1password: {
    accessToken: 'cmFuZG9tLWJ5dGVz',
    userId: 'user-id',
    userEmail: 'immich@test.com',
    name: 'immich_name',
    profileImagePath: '',
    isAdmin: false,
    shouldChangePassword: false,
  },
};
