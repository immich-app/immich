import { SharedLinkEntity, SharedLinkType, SystemConfig, UserEntity } from '@app/infra/db/entities';
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
  adminSharedLink: Object.freeze<AuthUserDto>({
    id: 'admin_id',
    email: 'admin@test.com',
    isAdmin: true,
    isAllowUpload: true,
    isAllowDownload: true,
    isPublicUser: true,
    isShowExif: true,
    sharedLinkId: '123',
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

export const systemConfigStub = {
  defaults: Object.freeze({
    ffmpeg: {
      crf: '23',
      preset: 'ultrafast',
      targetAudioCodec: 'aac',
      targetScaling: '1280:-2',
      targetVideoCodec: 'h264',
      transcodeAll: false,
    },
    oauth: {
      autoLaunch: false,
      autoRegister: true,
      buttonText: 'Login with OAuth',
      clientId: '',
      clientSecret: '',
      enabled: false,
      issuerUrl: '',
      mobileOverrideEnabled: false,
      mobileRedirectUri: '',
      scope: 'openid email profile',
    },
    passwordLogin: {
      enabled: true,
    },
    storageTemplate: {
      template: '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
    },
  } as SystemConfig),
};

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);

export const sharedLinkStub = {
  valid: Object.freeze({
    id: '123',
    userId: authStub.admin.id,
    key: Buffer.from('secret-key', 'utf8'),
    type: SharedLinkType.ALBUM,
    createdAt: today.toISOString(),
    expiresAt: tomorrow.toISOString(),
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    assets: [],
  } as SharedLinkEntity),
};
