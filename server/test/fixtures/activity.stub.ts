import { ActivityEntity } from 'src/entities/activity.entity';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';

export const activityStub = {
  oneComment: Object.freeze<ActivityEntity>({
    id: 'activity-1',
    comment: 'comment',
    isLiked: false,
    userId: authStub.admin.user.id,
    user: userStub.admin,
    assetId: assetStub.image.id,
    asset: assetStub.image,
    albumId: albumStub.oneAsset.id,
    album: albumStub.oneAsset,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  liked: Object.freeze<ActivityEntity>({
    id: 'activity-2',
    comment: null,
    isLiked: true,
    userId: authStub.admin.user.id,
    user: userStub.admin,
    assetId: assetStub.image.id,
    asset: assetStub.image,
    albumId: albumStub.oneAsset.id,
    album: albumStub.oneAsset,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};
