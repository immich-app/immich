import { randomUUID } from 'node:crypto';
import { Asset, AuthUser, User } from 'src/database';
import { OnThisDayData } from 'src/entities/memory.entity';
import { AssetStatus, AssetType, MemoryType } from 'src/enum';
import { ActivityItem, MemoryItem } from 'src/types';

export const newUuid = () => randomUUID() as string;
export const newUuids = () =>
  Array.from({ length: 100 })
    .fill(0)
    .map(() => newUuid());
export const newDate = () => new Date();
export const newUpdateId = () => 'uuid-v7';
export const newSha1 = () => Buffer.from('this is a fake hash');

const authUser = (authUser: Partial<AuthUser>) => ({
  id: newUuid(),
  isAdmin: false,
  name: 'Test User',
  email: 'test@immich.cloud',
  quotaUsageInBytes: 0,
  quotaSizeInBytes: null,
  ...authUser,
});

const user = (user: Partial<User>) => ({
  id: newUuid(),
  name: 'Test User',
  email: 'test@immich.cloud',
  profileImagePath: '',
  profileChangedAt: newDate(),
  ...user,
});

export const factory = {
  auth: (user: Partial<AuthUser> = {}) => ({
    user: authUser(user),
  }),
  authUser,
  user,
  asset: (asset: Partial<Asset> = {}) => ({
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
  }),
  activity: (activity: Partial<ActivityItem> = {}) => {
    const userId = activity.userId || newUuid();
    return {
      id: newUuid(),
      comment: null,
      isLiked: false,
      userId,
      user: user({ id: userId }),
      assetId: newUuid(),
      albumId: newUuid(),
      createdAt: newDate(),
      updatedAt: newDate(),
      updateId: newUpdateId(),
      ...activity,
    };
  },
  memory: (memory: Partial<MemoryItem> = {}) => ({
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
  }),
};
