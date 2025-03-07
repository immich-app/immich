import { randomUUID } from 'node:crypto';
import { AuthUser, User } from 'src/database';
import { ActivityItem } from 'src/types';

export const newUuid = () => randomUUID() as string;
export const newUuids = () =>
  Array.from({ length: 100 })
    .fill(0)
    .map(() => newUuid());
export const newDate = () => new Date();
export const newUpdateId = () => 'uuid-v7';

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
};
