import { AuthDto } from 'src/dtos/auth.dto';
import { SessionEntity } from 'src/entities/session.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';

const authUser = {
  admin: {
    id: 'admin_id',
    name: 'admin',
    email: 'admin@test.com',
    isAdmin: true,
    quotaSizeInBytes: null,
    quotaUsageInBytes: 0,
  },
  user1: {
    id: 'user-id',
    name: 'User 1',
    email: 'immich@test.com',
    isAdmin: false,
    quotaSizeInBytes: null,
    quotaUsageInBytes: 0,
  },
};

export const authStub = {
  admin: Object.freeze<AuthDto>({ user: authUser.admin }),
  user1: Object.freeze<AuthDto>({
    user: authUser.user1,
    session: {
      id: 'token-id',
    } as SessionEntity,
  }),
  user2: Object.freeze<AuthDto>({
    user: {
      id: 'user-2',
      name: 'User 2',
      email: 'user2@immich.cloud',
      isAdmin: false,
      quotaSizeInBytes: null,
      quotaUsageInBytes: 0,
    },
    session: {
      id: 'token-id',
    } as SessionEntity,
  }),
  adminSharedLink: Object.freeze<AuthDto>({
    user: authUser.admin,
    sharedLink: {
      id: '123',
      showExif: true,
      allowDownload: true,
      allowUpload: true,
      key: Buffer.from('shared-link-key'),
    } as SharedLinkEntity,
  }),
  adminSharedLinkNoExif: Object.freeze<AuthDto>({
    user: authUser.admin,
    sharedLink: {
      id: '123',
      showExif: false,
      allowDownload: true,
      allowUpload: true,
      key: Buffer.from('shared-link-key'),
    } as SharedLinkEntity,
  }),
  passwordSharedLink: Object.freeze<AuthDto>({
    user: authUser.admin,
    sharedLink: {
      id: '123',
      allowUpload: false,
      allowDownload: false,
      password: 'password-123',
      showExif: true,
    } as SharedLinkEntity,
  }),
};
