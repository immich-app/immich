import {
  Activity,
  ApiKey,
  AuthApiKey,
  AuthSharedLink,
  AuthUser,
  Library,
  Memory,
  Partner,
  Session,
  SidecarWriteAsset,
  User,
  UserAdmin,
} from 'src/database';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetStatus, AssetType, AssetVisibility, MemoryType, Permission, UserMetadataKey, UserStatus } from 'src/enum';
import { OnThisDayData, UserMetadataItem } from 'src/types';
import { v4, v7 } from 'uuid';

export const newUuid = () => v4();
export const newUuids = () =>
  Array.from({ length: 100 })
    .fill(0)
    .map(() => newUuid());
export const newDate = () => new Date();
export const newUuidV7 = () => v7();
export const newSha1 = () => Buffer.from('this is a fake hash');
export const newEmbedding = () => {
  const embedding = Array.from({ length: 512 })
    .fill(0)
    .map(() => Math.random());
  return '[' + embedding + ']';
};

const authFactory = ({
  apiKey,
  session,
  sharedLink,
  user,
}: {
  apiKey?: Partial<AuthApiKey>;
  session?: { id: string };
  user?: Omit<
    Partial<UserAdmin>,
    'createdAt' | 'updatedAt' | 'deletedAt' | 'fileCreatedAt' | 'fileModifiedAt' | 'localDateTime' | 'profileChangedAt'
  >;
  sharedLink?: Partial<AuthSharedLink>;
} = {}) => {
  const auth: AuthDto = {
    user: authUserFactory(userAdminFactory(user ?? {})),
  };

  const userId = auth.user.id;

  if (apiKey) {
    auth.apiKey = authApiKeyFactory(apiKey);
  }

  if (session) {
    auth.session = {
      id: session.id,
      hasElevatedPermission: false,
    };
  }

  if (sharedLink) {
    auth.sharedLink = authSharedLinkFactory({ ...sharedLink, userId });
  }

  return auth;
};

const authSharedLinkFactory = (sharedLink: Partial<AuthSharedLink> = {}) => {
  const {
    id = newUuid(),
    expiresAt = null,
    userId = newUuid(),
    showExif = true,
    allowUpload = false,
    allowDownload = true,
    password = null,
  } = sharedLink;

  return { id, expiresAt, userId, showExif, allowUpload, allowDownload, password };
};

const authApiKeyFactory = (apiKey: Partial<AuthApiKey> = {}) => ({
  id: newUuid(),
  permissions: [Permission.All],
  ...apiKey,
});

const authUserFactory = (authUser: Partial<AuthUser> = {}) => {
  const {
    id = newUuid(),
    isAdmin = false,
    name = 'Test User',
    email = 'test@immich.cloud',
    quotaUsageInBytes = 0,
    quotaSizeInBytes = null,
  } = authUser;

  return { id, isAdmin, name, email, quotaUsageInBytes, quotaSizeInBytes };
};

const partnerFactory = (partner: Partial<Partner> = {}) => {
  const sharedBy = userFactory(partner.sharedBy || {});
  const sharedWith = userFactory(partner.sharedWith || {});

  return {
    sharedById: sharedBy.id,
    sharedBy,
    sharedWithId: sharedWith.id,
    sharedWith,
    createId: newUuidV7(),
    createdAt: newDate(),
    updatedAt: newDate(),
    updateId: newUuidV7(),
    inTimeline: true,
    ...partner,
  };
};

const sessionFactory = (session: Partial<Session> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  deviceOS: 'android',
  deviceType: 'mobile',
  token: 'abc123',
  parentId: null,
  expiresAt: null,
  userId: newUuid(),
  pinExpiresAt: newDate(),
  isPendingSyncReset: false,
  ...session,
});

const stackFactory = () => ({
  id: newUuid(),
  ownerId: newUuid(),
  primaryAssetId: newUuid(),
});

const userFactory = (user: Partial<User> = {}) => ({
  id: newUuid(),
  name: 'Test User',
  email: 'test@immich.cloud',
  avatarColor: null,
  profileImagePath: '',
  profileChangedAt: newDate(),
  metadata: [
    {
      key: UserMetadataKey.Onboarding,
      value: 'true',
    },
  ] as UserMetadataItem[],
  ...user,
});

const userAdminFactory = (user: Partial<UserAdmin> = {}) => {
  const {
    id = newUuid(),
    name = 'Test User',
    email = 'test@immich.cloud',
    profileImagePath = '',
    profileChangedAt = newDate(),
    storageLabel = null,
    shouldChangePassword = false,
    isAdmin = false,
    avatarColor = null,
    createdAt = newDate(),
    updatedAt = newDate(),
    deletedAt = null,
    oauthId = '',
    quotaSizeInBytes = null,
    quotaUsageInBytes = 0,
    status = UserStatus.Active,
    metadata = [],
  } = user;
  return {
    id,
    name,
    email,
    profileImagePath,
    profileChangedAt,
    storageLabel,
    shouldChangePassword,
    isAdmin,
    avatarColor,
    createdAt,
    updatedAt,
    deletedAt,
    oauthId,
    quotaSizeInBytes,
    quotaUsageInBytes,
    status,
    metadata,
  };
};

const assetFactory = (asset: Partial<MapAsset> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  deletedAt: null,
  updateId: newUuidV7(),
  status: AssetStatus.Active,
  checksum: newSha1(),
  deviceAssetId: '',
  deviceId: '',
  duplicateId: null,
  duration: null,
  encodedVideoPath: null,
  fileCreatedAt: newDate(),
  fileModifiedAt: newDate(),
  isExternal: false,
  isFavorite: false,
  isOffline: false,
  libraryId: null,
  livePhotoVideoId: null,
  localDateTime: newDate(),
  originalFileName: 'IMG_123.jpg',
  originalPath: `/data/12/34/IMG_123.jpg`,
  ownerId: newUuid(),
  sidecarPath: null,
  stackId: null,
  thumbhash: null,
  type: AssetType.Image,
  visibility: AssetVisibility.Timeline,
  ...asset,
});

const activityFactory = (activity: Partial<Activity> = {}) => {
  const userId = activity.userId || newUuid();
  return {
    id: newUuid(),
    comment: null,
    isLiked: false,
    userId,
    user: userFactory({ id: userId }),
    assetId: newUuid(),
    albumId: newUuid(),
    createdAt: newDate(),
    updatedAt: newDate(),
    updateId: newUuidV7(),
    ...activity,
  };
};

const apiKeyFactory = (apiKey: Partial<ApiKey> = {}) => ({
  id: newUuid(),
  userId: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  name: 'Api Key',
  permissions: [Permission.All],
  ...apiKey,
});

const libraryFactory = (library: Partial<Library> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  deletedAt: null,
  refreshedAt: null,
  name: 'Library',
  assets: [],
  ownerId: newUuid(),
  importPaths: [],
  exclusionPatterns: [],
  ...library,
});

const memoryFactory = (memory: Partial<Memory> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUuidV7(),
  deletedAt: null,
  ownerId: newUuid(),
  type: MemoryType.OnThisDay,
  data: { year: 2024 } as OnThisDayData,
  isSaved: false,
  memoryAt: newDate(),
  seenAt: null,
  showAt: newDate(),
  hideAt: newDate(),
  assets: [],
  ...memory,
});

const versionHistoryFactory = () => ({
  id: newUuid(),
  createdAt: newDate(),
  version: '1.123.45',
});

const assetSidecarWriteFactory = (asset: Partial<SidecarWriteAsset> = {}) => ({
  id: newUuid(),
  sidecarPath: '/path/to/original-path.jpg.xmp',
  originalPath: '/path/to/original-path.jpg.xmp',
  tags: [],
  ...asset,
});

export const factory = {
  activity: activityFactory,
  apiKey: apiKeyFactory,
  asset: assetFactory,
  auth: authFactory,
  authApiKey: authApiKeyFactory,
  authUser: authUserFactory,
  library: libraryFactory,
  memory: memoryFactory,
  partner: partnerFactory,
  session: sessionFactory,
  stack: stackFactory,
  user: userFactory,
  userAdmin: userAdminFactory,
  versionHistory: versionHistoryFactory,
  jobAssets: {
    sidecarWrite: assetSidecarWriteFactory,
  },
  uuid: newUuid,
  date: newDate,
  responses: {
    badRequest: (message: any = null) => ({
      error: 'Bad Request',
      statusCode: 400,
      message: message ?? expect.anything(),
    }),
  },
};
