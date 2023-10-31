import { ActivityEntity } from '@app/infra/entities';
import { albumStub } from './album.stub';
import { assetStub } from './asset.stub';
import { authStub } from './auth.stub';
import { userStub } from './user.stub';

export const activityStub = {
  oneComment: Object.freeze<ActivityEntity>({
    id: 'activity-1',
    comment: 'comment',
    isLiked: false,
    userId: authStub.admin.id,
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
    userId: authStub.admin.id,
    user: userStub.admin,
    assetId: assetStub.image.id,
    asset: assetStub.image,
    albumId: albumStub.oneAsset.id,
    album: albumStub.oneAsset,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};
