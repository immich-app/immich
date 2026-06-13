import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';

User mapToUser(UserEntityData data) => User(
  id: data.id,
  name: data.name,
  email: data.email,
  hasProfileImage: data.hasProfileImage,
  profileChangedAt: data.profileChangedAt,
  avatarColor: data.avatarColor,
);

Partner mapToPartner(UserEntityData user, PartnerEntityData partner) =>
    Partner.fromUser(mapToUser(user), inTimeline: partner.inTimeline);

LocalAlbum mapToLocalAlbum(LocalAlbumEntityData data, {int assetCount = 0}) => LocalAlbum(
  id: data.id,
  name: data.name,
  updatedAt: data.updatedAt,
  assetCount: assetCount,
  backupSelection: data.backupSelection,
  linkedRemoteAlbumId: data.linkedRemoteAlbumId,
  isIosSharedAlbum: data.isIosSharedAlbum,
);

LocalAsset mapToLocalAsset(LocalAssetEntityData data, {String? remoteId}) => LocalAsset(
  id: data.id,
  name: data.name,
  checksum: data.checksum,
  type: data.type,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  durationMs: data.durationMs,
  isFavorite: data.isFavorite,
  height: data.height,
  width: data.width,
  remoteId: remoteId,
  orientation: data.orientation,
  playbackStyle: data.playbackStyle,
  adjustmentTime: data.adjustmentTime,
  latitude: data.latitude,
  longitude: data.longitude,
  cloudId: data.iCloudId,
  isEdited: false,
);
