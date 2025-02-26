import { ActivityItem } from 'src/types';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';

export const activityStub = {
  oneComment: Object.freeze<ActivityItem>({
    id: 'activity-1',
    comment: 'comment',
    isLiked: false,
    userId: 'admin_id',
    user: {
      id: 'admin_id',
      name: 'admin',
      email: 'admin@test.com',
      profileImagePath: '',
      profileChangedAt: new Date('2021-01-01'),
    },
    assetId: assetStub.image.id,
    albumId: albumStub.oneAsset.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  liked: Object.freeze<ActivityItem>({
    id: 'activity-2',
    comment: null,
    isLiked: true,
    userId: 'admin_id',
    user: {
      id: 'admin_id',
      name: 'admin',
      email: 'admin@test.com',
      profileImagePath: '',
      profileChangedAt: new Date('2021-01-01'),
    },
    assetId: assetStub.image.id,
    albumId: albumStub.oneAsset.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};
