import 'dart:math';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:uuid/uuid.dart';

import '../utils.dart';

class MediumRepositoryContext {
  final Drift db;
  final Random _random = Random();

  MediumRepositoryContext() : db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));

  Future<void> dispose() async {
    await db.close();
  }

  static Value<T> _resolveUndefined<T>(T? plain, Option<T>? option, T fallback) {
    if (plain != null) {
      return Value(plain);
    }

    return _resolveOption(option, fallback);
  }

  static Value<T> _resolveOption<T>(Option<T>? option, T fallback) {
    if (option != null) {
      return option.fold(Value.new, Value.absent);
    }

    return Value(fallback);
  }

  Future<UserEntityData> newUser({
    String? id,
    String? email,
    AvatarColor? avatarColor,
    DateTime? profileChangedAt,
    bool? hasProfileImage,
  }) async {
    id = TestUtils.uuid(id);
    return await db
        .into(db.userEntity)
        .insertReturning(
          UserEntityCompanion(
            id: Value(id),
            email: Value(email ?? '$id@test.com'),
            name: Value(email ?? 'user_$id'),
            avatarColor: Value(avatarColor ?? AvatarColor.values[_random.nextInt(AvatarColor.values.length)]),
            profileChangedAt: Value(TestUtils.date(profileChangedAt)),
            hasProfileImage: Value(hasProfileImage ?? false),
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
    int? durationInSeconds,
    int? width,
    int? height,
    bool? isFavorite,
    bool? isEdited,
    String? livePhotoVideoId,
    String? stackId,
    String? thumbHash,
    String? libraryId,
  }) async {
    id = TestUtils.uuid(id);
    createdAt = TestUtils.date(createdAt);
    return db
        .into(db.remoteAssetEntity)
        .insertReturning(
          RemoteAssetEntityCompanion(
            id: Value(id),
            name: Value('remote_$id.jpg'),
            checksum: Value(TestUtils.uuid(checksum)),
            type: Value(type ?? AssetType.image),
            createdAt: Value(createdAt),
            updatedAt: Value(TestUtils.date(updatedAt)),
            ownerId: Value(TestUtils.uuid(ownerId)),
            visibility: Value(visibility ?? AssetVisibility.timeline),
            deletedAt: Value(deletedAt),
            durationInSeconds: Value(durationInSeconds ?? 0),
            width: Value(width ?? _random.nextInt(1000)),
            height: Value(height ?? _random.nextInt(1000)),
            isFavorite: Value(isFavorite ?? false),
            isEdited: Value(isEdited ?? false),
            livePhotoVideoId: Value(livePhotoVideoId),
            stackId: Value(stackId),
            localDateTime: Value(createdAt.toLocal()),
            thumbHash: Value(TestUtils.uuid(thumbHash)),
            libraryId: Value(TestUtils.uuid(libraryId)),
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
            assetId: Value(TestUtils.uuid(id)),
            cloudId: Value(TestUtils.uuid(cloudId)),
            createdAt: Value(TestUtils.date(createdAt)),
            adjustmentTime: _resolveUndefined(adjustmentTime, adjustmentTimeOption, DateTime.now()),
            latitude: _resolveOption(latitude, _random.nextDouble() * 180 - 90),
            longitude: _resolveOption(longitude, _random.nextDouble() * 360 - 180),
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
    id = TestUtils.uuid(id);
    return db
        .into(db.remoteAlbumEntity)
        .insertReturning(
          RemoteAlbumEntityCompanion(
            id: Value(id),
            name: Value(name ?? 'remote_album_$id'),
            ownerId: Value(TestUtils.uuid(ownerId)),
            createdAt: Value(TestUtils.date(createdAt)),
            updatedAt: Value(TestUtils.date(updatedAt)),
            description: Value(description ?? 'Description for album $id'),
            isActivityEnabled: Value(isActivityEnabled ?? false),
            order: Value(order ?? AlbumAssetOrder.asc),
            thumbnailAssetId: Value(thumbnailAssetId),
          ),
        );
  }

  Future<void> insertRemoteAlbumAsset({required String albumId, required String assetId}) {
    return db
        .into(db.remoteAlbumAssetEntity)
        .insert(RemoteAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
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
    int? durationInSeconds,
    int? orientation,
    DateTime? updatedAt,
  }) async {
    id = TestUtils.uuid(id);
    return db
        .into(db.localAssetEntity)
        .insertReturning(
          LocalAssetEntityCompanion(
            id: Value(id),
            name: Value(name ?? 'local_$id.jpg'),
            height: Value(height ?? _random.nextInt(1000)),
            width: Value(width ?? _random.nextInt(1000)),
            durationInSeconds: Value(durationInSeconds ?? 0),
            orientation: Value(orientation ?? 0),
            updatedAt: Value(TestUtils.date(updatedAt)),
            checksum: _resolveUndefined(checksum, checksumOption, const Uuid().v4()),
            createdAt: Value(TestUtils.date(createdAt)),
            type: Value(type ?? AssetType.image),
            isFavorite: Value(isFavorite ?? false),
            iCloudId: Value(TestUtils.uuid(iCloudId)),
            adjustmentTime: _resolveUndefined(adjustmentTime, adjustmentTimeOption, DateTime.now()),
            latitude: Value(latitude ?? _random.nextDouble() * 180 - 90),
            longitude: Value(longitude ?? _random.nextDouble() * 360 - 180),
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
    id = TestUtils.uuid(id);
    return db
        .into(db.localAlbumEntity)
        .insertReturning(
          LocalAlbumEntityCompanion(
            id: Value(id),
            name: Value(name ?? 'local_album_$id'),
            updatedAt: Value(TestUtils.date(updatedAt)),
            backupSelection: Value(backupSelection ?? BackupSelection.none),
            isIosSharedAlbum: Value(isIosSharedAlbum ?? false),
            linkedRemoteAlbumId: Value(linkedRemoteAlbumId),
          ),
        );
  }

  Future<void> newLocalAlbumAsset({required String albumId, required String assetId}) {
    return db
        .into(db.localAlbumAssetEntity)
        .insert(LocalAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
  }
}
