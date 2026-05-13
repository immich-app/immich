import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:uuid/uuid.dart';

import '../utils.dart';

class MediumRepositoryContext {
  final Drift db;

  MediumRepositoryContext() : db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));

  Future<void> dispose() async {
    await db.close();
  }

  static Value<T> _resolveUndefined<T>(T? plain, Option<T>? option, T fallback) {
    if (plain != null) {
      return .new(plain);
    }

    return _resolveOption(option, fallback);
  }

  static Value<T> _resolveOption<T>(Option<T>? option, T fallback) {
    if (option != null) {
      return option.fold(Value.new, Value.absent);
    }

    return .new(fallback);
  }

  Future<UserEntityData> newUser({
    String? id,
    String? email,
    AvatarColor? avatarColor,
    DateTime? profileChangedAt,
    bool? hasProfileImage,
  }) async {
    id ??= TestUtils.uuid();
    return await db
        .into(db.userEntity)
        .insertReturning(
          UserEntityCompanion(
            id: .new(id),
            email: .new(email ?? '$id@test.com'),
            name: .new(email ?? 'user_$id'),
            avatarColor: .new(avatarColor ?? TestUtils.randElement(AvatarColor.values)),
            profileChangedAt: .new(TestUtils.date(profileChangedAt)),
            hasProfileImage: .new(hasProfileImage ?? false),
          ),
        );
  }

  Future<RemoteAssetEntityData> newRemoteAsset({
    String? id,
    String? checksum,
    String? ownerId,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
    AssetType? type,
    AssetVisibility? visibility,
    int? durationMs,
    int? width,
    int? height,
    bool? isFavorite,
    bool? isEdited,
    String? livePhotoVideoId,
    String? stackId,
    String? thumbHash,
    String? libraryId,
  }) async {
    id ??= TestUtils.uuid();
    createdAt ??= TestUtils.date();
    return db
        .into(db.remoteAssetEntity)
        .insertReturning(
          RemoteAssetEntityCompanion(
            id: .new(id),
            name: .new('remote_$id.jpg'),
            checksum: .new(TestUtils.uuid(checksum)),
            type: .new(type ?? .image),
            createdAt: .new(createdAt),
            updatedAt: .new(TestUtils.date(updatedAt)),
            ownerId: .new(TestUtils.uuid(ownerId)),
            visibility: .new(visibility ?? .timeline),
            deletedAt: .new(deletedAt),
            durationMs: .new(durationMs ?? 0),
            width: .new(width ?? TestUtils.randInt(1000)),
            height: .new(height ?? TestUtils.randInt(1000)),
            isFavorite: .new(isFavorite ?? false),
            isEdited: .new(isEdited ?? false),
            livePhotoVideoId: .new(livePhotoVideoId),
            stackId: .new(stackId),
            localDateTime: .new(createdAt.toLocal()),
            thumbHash: .new(TestUtils.uuid(thumbHash)),
            libraryId: .new(TestUtils.uuid(libraryId)),
          ),
        );
  }

  Future<RemoteAssetCloudIdEntityData> newRemoteAssetCloudId({
    String? id,
    String? cloudId,
    DateTime? createdAt,
    DateTime? adjustmentTime,
    Option<DateTime>? adjustmentTimeOption,
    Option<double>? latitude,
    Option<double>? longitude,
  }) {
    return db
        .into(db.remoteAssetCloudIdEntity)
        .insertReturning(
          RemoteAssetCloudIdEntityCompanion(
            assetId: .new(TestUtils.uuid(id)),
            cloudId: .new(TestUtils.uuid(cloudId)),
            createdAt: .new(TestUtils.date(createdAt)),
            adjustmentTime: _resolveUndefined(adjustmentTime, adjustmentTimeOption, DateTime.now()),
            latitude: _resolveOption(latitude, TestUtils.randDouble(-90, 90)),
            longitude: _resolveOption(longitude, TestUtils.randDouble(-180, 180)),
          ),
        );
  }

  Future<RemoteAlbumEntityData> newRemoteAlbum({
    String? id,
    String? name,
    String? ownerId,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? description,
    bool? isActivityEnabled,
    AlbumAssetOrder? order,
    String? thumbnailAssetId,
  }) async {
    id ??= TestUtils.uuid();
    final album = await db
        .into(db.remoteAlbumEntity)
        .insertReturning(
          RemoteAlbumEntityCompanion(
            id: .new(id),
            name: .new(name ?? 'remote_album_$id'),
            createdAt: .new(TestUtils.date(createdAt)),
            updatedAt: .new(TestUtils.date(updatedAt)),
            description: .new(description ?? 'Description for album $id'),
            isActivityEnabled: .new(isActivityEnabled ?? false),
            order: .new(order ?? .asc),
            thumbnailAssetId: .new(thumbnailAssetId),
          ),
        );

    await db
        .into(db.remoteAlbumUserEntity)
        .insert(
          RemoteAlbumUserEntityCompanion(
            albumId: .new(id),
            userId: .new(TestUtils.uuid(ownerId)),
            role: const .new(.owner),
          ),
        );

    return album;
  }

  Future<void> newRemoteAlbumAsset({required String albumId, required String assetId}) {
    return db
        .into(db.remoteAlbumAssetEntity)
        .insert(RemoteAlbumAssetEntityCompanion(albumId: .new(albumId), assetId: .new(assetId)));
  }

  Future<PersonEntityData> newPerson({String? id, String? ownerId, String? name, bool? isFavorite, bool? isHidden}) {
    id ??= TestUtils.uuid();
    return db
        .into(db.personEntity)
        .insertReturning(
          PersonEntityCompanion(
            id: .new(id),
            ownerId: .new(TestUtils.uuid(ownerId)),
            name: .new(name ?? 'person_$id'),
            isFavorite: .new(isFavorite ?? false),
            isHidden: .new(isHidden ?? false),
          ),
        );
  }

  Future<AssetFaceEntityData> newFace({String? assetId, String? personId, int? imageWidth, int? imageHeight}) {
    imageWidth ??= TestUtils.randInt(999) + 1;
    imageHeight ??= TestUtils.randInt(999) + 1;

    final x1 = TestUtils.randInt(imageWidth - 1);
    final y1 = TestUtils.randInt(imageHeight - 1);
    final x2 = x1 + 1 + TestUtils.randInt(imageWidth - x1 - 1);
    final y2 = y1 + 1 + TestUtils.randInt(imageHeight - y1 - 1);

    return db
        .into(db.assetFaceEntity)
        .insertReturning(
          AssetFaceEntityCompanion(
            id: .new(TestUtils.uuid()),
            assetId: .new(TestUtils.uuid(assetId)),
            personId: .new(TestUtils.uuid(personId)),
            imageWidth: .new(imageWidth),
            imageHeight: .new(imageHeight),
            boundingBoxX1: .new(x1),
            boundingBoxY1: .new(y1),
            boundingBoxX2: .new(x2),
            boundingBoxY2: .new(y2),
            sourceType: const .new('machine-learning'),
          ),
        );
  }

  Future<LocalAssetEntityData> newLocalAsset({
    String? id,
    String? name,
    String? checksum,
    Option<String>? checksumOption,
    DateTime? createdAt,
    AssetType? type,
    bool? isFavorite,
    String? iCloudId,
    DateTime? adjustmentTime,
    Option<DateTime>? adjustmentTimeOption,
    double? latitude,
    double? longitude,
    int? width,
    int? height,
    int? durationMs,
    int? orientation,
    DateTime? updatedAt,
  }) async {
    id ??= TestUtils.uuid();
    return db
        .into(db.localAssetEntity)
        .insertReturning(
          LocalAssetEntityCompanion(
            id: .new(id),
            name: .new(name ?? 'local_$id.jpg'),
            height: .new(height ?? TestUtils.randInt(1000)),
            width: .new(width ?? TestUtils.randInt(1000)),
            durationMs: .new(durationMs ?? 0),
            orientation: .new(orientation ?? 0),
            updatedAt: .new(TestUtils.date(updatedAt)),
            checksum: _resolveUndefined(checksum, checksumOption, const Uuid().v4()),
            createdAt: .new(TestUtils.date(createdAt)),
            type: .new(type ?? .image),
            isFavorite: .new(isFavorite ?? false),
            iCloudId: .new(TestUtils.uuid(iCloudId)),
            adjustmentTime: _resolveUndefined(adjustmentTime, adjustmentTimeOption, DateTime.now()),
            latitude: .new(latitude ?? TestUtils.randDouble(-90, 90)),
            longitude: .new(longitude ?? TestUtils.randDouble(-180, 180)),
          ),
        );
  }

  Future<LocalAlbumEntityData> newLocalAlbum({
    String? id,
    String? name,
    DateTime? updatedAt,
    BackupSelection? backupSelection,
    bool? isIosSharedAlbum,
    String? linkedRemoteAlbumId,
  }) {
    id ??= TestUtils.uuid();
    return db
        .into(db.localAlbumEntity)
        .insertReturning(
          LocalAlbumEntityCompanion(
            id: .new(id),
            name: .new(name ?? 'local_album_$id'),
            updatedAt: .new(TestUtils.date(updatedAt)),
            backupSelection: .new(backupSelection ?? .none),
            isIosSharedAlbum: .new(isIosSharedAlbum ?? false),
            linkedRemoteAlbumId: .new(linkedRemoteAlbumId),
          ),
        );
  }

  Future<void> newLocalAlbumAsset({required String albumId, required String assetId}) => db
      .into(db.localAlbumAssetEntity)
      .insert(LocalAlbumAssetEntityCompanion(albumId: .new(albumId), assetId: .new(assetId)));
}
