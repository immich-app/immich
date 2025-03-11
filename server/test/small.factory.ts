import { randomUUID } from 'node:crypto';
import { ApiKey, Asset, AuthApiKey, AuthUser, Library, Partner, User } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { OnThisDayData } from 'src/entities/memory.entity';
import { AssetStatus, AssetType, MemoryType, Permission } from 'src/enum';
import { ActivityItem, MemoryItem } from 'src/types';

export const newUuid = () => randomUUID() as string;
export const newUuids = () =>
  Array.from({ length: 100 })
    .fill(0)
    .map(() => newUuid());
export const newDate = () => new Date();
export const newUpdateId = () => 'uuid-v7';
export const newSha1 = () => Buffer.from('this is a fake hash');

const authFactory = ({ apiKey, ...user }: Partial<AuthUser> & { apiKey?: Partial<AuthApiKey> } = {}) => {
  const auth: AuthDto = {
    user: authUserFactory(user),
  };

  if (apiKey) {
    auth.apiKey = authApiKeyFactory(apiKey);
  }

  return auth;
};

const authApiKeyFactory = (apiKey: Partial<AuthApiKey> = {}) => ({
  id: newUuid(),
  permissions: [Permission.ALL],
  ...apiKey,
});

const authUserFactory = (authUser: Partial<AuthUser> = {}) => ({
  id: newUuid(),
  isAdmin: false,
  name: 'Test User',
  email: 'test@immich.cloud',
  quotaUsageInBytes: 0,
  quotaSizeInBytes: null,
  ...authUser,
});

const partnerFactory = (partner: Partial<Partner> = {}) => {
  const sharedBy = userFactory(partner.sharedBy || {});
  const sharedWith = userFactory(partner.sharedWith || {});

  return {
    sharedById: sharedBy.id,
    sharedBy,
    sharedWithId: sharedWith.id,
    sharedWith,
    createdAt: newDate(),
    updatedAt: newDate(),
    updateId: newUpdateId(),
    inTimeline: true,
    ...partner,
  };
};

const sessionFactory = () => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUpdateId(),
  deviceOS: 'android',
  deviceType: 'mobile',
  token: 'abc123',
  userId: newUuid(),
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
  profileImagePath: '',
  profileChangedAt: newDate(),
  ...user,
});

const assetFactory = (asset: Partial<Asset> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  deletedAt: null,
  updateId: newUpdateId(),
  status: AssetStatus.ACTIVE,
  checksum: newSha1(),
  deviceAssetId: '',
  deviceId: '',
  duplicateId: null,
  duration: null,
  encodedVideoPath: null,
  fileCreatedAt: newDate(),
  fileModifiedAt: newDate(),
  isArchived: false,
  isExternal: false,
  isFavorite: false,
  isOffline: false,
  isVisible: true,
  libraryId: null,
  livePhotoVideoId: null,
  localDateTime: newDate(),
  originalFileName: 'IMG_123.jpg',
  originalPath: `upload/12/34/IMG_123.jpg`,
  ownerId: newUuid(),
  sidecarPath: null,
  stackId: null,
  thumbhash: null,
  type: AssetType.IMAGE,
  ...asset,
});

const activityFactory = (activity: Partial<ActivityItem> = {}) => {
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
    updateId: newUpdateId(),
    ...activity,
  };
};

const apiKeyFactory = (apiKey: Partial<ApiKey> = {}) => ({
  id: newUuid(),
  userId: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUpdateId(),
  name: 'Api Key',
  permissions: [Permission.ALL],
  ...apiKey,
});

const libraryFactory = (library: Partial<Library> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUpdateId(),
  deletedAt: null,
  refreshedAt: null,
  name: 'Library',
  assets: [],
  ownerId: newUuid(),
  importPaths: [],
  exclusionPatterns: [],
  ...library,
});

const memoryFactory = (memory: Partial<MemoryItem> = {}) => ({
  id: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  updateId: newUpdateId(),
  deletedAt: null,
  ownerId: newUuid(),
  type: MemoryType.ON_THIS_DAY,
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
  versionHistory: versionHistoryFactory,
};
