// ignore_for_file: add-copy-with

import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

part 'album.model.g.dart';

/// Acts as a common class for RemoteAlbums and LocalAlbums to perform generic album handling irrespective of
/// where the album is from
sealed class Album {
  Id get isarId => fastHash(id);
  @Index(unique: true, replace: true, type: IndexType.hash)
  final String id;
  String name;
  DateTime modifiedAt;
  final IsarLink<Asset> thumb = IsarLink<Asset>();

  static const assetsLinkId = 'assets';
  final IsarLinks<Asset> assets = IsarLinks<Asset>();

  @ignore
  int get assetCount => assets.length;

  @ignore
  Asset? get thumbnail => thumb.value;

  Album({
    required this.id,
    required this.name,
    required this.modifiedAt,
  });

  @override
  String toString() {
    return 'Album(id: $id, name: $name, assetCount: $assetCount)';
  }

  @override
  bool operator ==(covariant Album other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.modifiedAt == modifiedAt &&
        other.thumb == thumb &&
        other.assetCount == assetCount;
  }

  @override
  @ignore
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        modifiedAt.hashCode ^
        thumb.hashCode ^
        assetCount.hashCode;
  }
}

@Collection()
class LocalAlbum extends Album {
  static const isAllId = 'isAll';

  @Backlink(to: BackupAlbum.albumLinkId)
  final IsarLink<BackupAlbum> backup = IsarLink<BackupAlbum>();

  LocalAlbum({
    required super.id,
    required super.name,
    required super.modifiedAt,
  });

  @override
  String toString() {
    return 'LocalAlbum(id: $id, name: $name, assetCount: $assetCount)';
  }

  static LocalAlbum fromAssetPathEntity(
    AssetPathEntity ape, {
    Asset? thumbnail,
    Iterable<Asset>? assets,
  }) {
    final album = LocalAlbum(
      id: ape.id,
      name: ape.name,
      modifiedAt: ape.lastModified?.toUtc() ?? DateTime.now().toUtc(),
    );

    if (assets != null) {
      album.assets.addAll(assets);
    }

    album.thumb.value = thumbnail;
    return album;
  }
}

@Collection()
class RemoteAlbum extends Album {
  DateTime createdAt;
  DateTime? startDate;
  DateTime? endDate;
  DateTime? lastModifiedAssetTimestamp;
  bool shared;
  bool activityEnabled;
  final IsarLink<User> owner = IsarLink<User>();
  final IsarLinks<User> sharedUsers = IsarLinks<User>();

  @ignore
  String? get ownerId => owner.value?.id;

  @ignore
  String? get ownerName {
    // Guard null owner
    if (owner.value == null) {
      return null;
    }

    final name = <String>[];
    if (owner.value?.name != null) {
      name.add(owner.value!.name);
    }

    return name.join(' ');
  }

  RemoteAlbum({
    required super.id,
    required super.name,
    required super.modifiedAt,
    required this.createdAt,
    this.startDate,
    this.endDate,
    this.lastModifiedAssetTimestamp,
    this.shared = false,
    this.activityEnabled = true,
  });

  @override
  String toString() {
    return 'RemoteAlbum(id: $id, name: $name, assetCount: $assetCount, createdAt: $createdAt, startDate: $startDate, endDate: $endDate, lastModifiedAssetTimestamp: $lastModifiedAssetTimestamp, shared: $shared, activityEnabled: $activityEnabled)';
  }

  @override
  bool operator ==(covariant RemoteAlbum other) {
    if (identical(this, other)) return true;

    final lastModifiedAssetTimestampIsSetAndEqual =
        lastModifiedAssetTimestamp != null &&
                other.lastModifiedAssetTimestamp != null
            ? lastModifiedAssetTimestamp!
                .isAtSameMomentAs(other.lastModifiedAssetTimestamp!)
            : true;

    return super == other &&
        other.createdAt == createdAt &&
        other.startDate == startDate &&
        other.endDate == endDate &&
        lastModifiedAssetTimestampIsSetAndEqual &&
        other.shared == shared &&
        other.activityEnabled == activityEnabled;
  }

  @override
  int get hashCode {
    return super.hashCode ^
        createdAt.hashCode ^
        startDate.hashCode ^
        endDate.hashCode ^
        lastModifiedAssetTimestamp.hashCode ^
        shared.hashCode ^
        activityEnabled.hashCode;
  }

  static Future<RemoteAlbum> fromDto(AlbumResponseDto dto, Isar db) async {
    final album = RemoteAlbum(
      id: dto.id,
      name: dto.albumName,
      createdAt: dto.createdAt,
      modifiedAt: dto.updatedAt,
      lastModifiedAssetTimestamp: dto.lastModifiedAssetTimestamp,
      shared: dto.shared,
      startDate: dto.startDate,
      endDate: dto.endDate,
      activityEnabled: dto.isActivityEnabled,
    );

    album.owner.value = await db.users.getById(dto.ownerId);

    if (dto.albumThumbnailAssetId != null) {
      album.thumb.value = await db.assets
          .where()
          .remoteIdEqualTo(dto.albumThumbnailAssetId)
          .findFirst();
    }

    if (dto.sharedUsers.isNotEmpty) {
      final users = await db.users
          .getAllById(dto.sharedUsers.map((e) => e.id).toList(growable: false));
      album.sharedUsers.addAll(users.cast());
    }

    if (dto.assets.isNotEmpty) {
      final assets =
          await db.assets.getAllByRemoteId(dto.assets.map((e) => e.id));
      album.assets.addAll(assets);
    }

    return album;
  }
}
