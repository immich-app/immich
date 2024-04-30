import 'package:flutter/foundation.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/utils/datetime_comparison.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

part 'album.entity.g.dart';

@Collection(inheritance: false)
class Album {
  @protected
  Album({
    this.remoteId,
    this.localId,
    required this.name,
    required this.createdAt,
    required this.modifiedAt,
    this.startDate,
    this.endDate,
    this.lastModifiedAssetTimestamp,
    required this.shared,
    required this.activityEnabled,
  });

  Id id = Isar.autoIncrement;
  @Index(unique: false, replace: false, type: IndexType.hash)
  String? remoteId;
  @Index(unique: false, replace: false, type: IndexType.hash)
  String? localId;
  String name;
  DateTime createdAt;
  DateTime modifiedAt;
  DateTime? startDate;
  DateTime? endDate;
  DateTime? lastModifiedAssetTimestamp;
  bool shared;
  bool activityEnabled;
  final IsarLink<User> owner = IsarLink<User>();
  final IsarLink<Asset> thumbnail = IsarLink<Asset>();
  final IsarLinks<User> sharedUsers = IsarLinks<User>();
  final IsarLinks<Asset> assets = IsarLinks<Asset>();

  @ignore
  bool get isRemote => remoteId != null;

  @ignore
  bool get isLocal => localId != null;

  @ignore
  int get assetCount => assets.length;

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

  @override
  bool operator ==(other) {
    if (other is! Album) return false;
    return id == other.id &&
        remoteId == other.remoteId &&
        localId == other.localId &&
        name == other.name &&
        createdAt.isAtSameMomentAs(other.createdAt) &&
        modifiedAt.isAtSameMomentAs(other.modifiedAt) &&
        isAtSameMomentAs(startDate, other.startDate) &&
        isAtSameMomentAs(endDate, other.endDate) &&
        isAtSameMomentAs(
          lastModifiedAssetTimestamp,
          other.lastModifiedAssetTimestamp,
        ) &&
        shared == other.shared &&
        activityEnabled == other.activityEnabled &&
        owner.value == other.owner.value &&
        thumbnail.value == other.thumbnail.value &&
        sharedUsers.length == other.sharedUsers.length &&
        assets.length == other.assets.length;
  }

  @override
  @ignore
  int get hashCode =>
      id.hashCode ^
      remoteId.hashCode ^
      localId.hashCode ^
      name.hashCode ^
      createdAt.hashCode ^
      modifiedAt.hashCode ^
      startDate.hashCode ^
      endDate.hashCode ^
      lastModifiedAssetTimestamp.hashCode ^
      shared.hashCode ^
      activityEnabled.hashCode ^
      owner.value.hashCode ^
      thumbnail.value.hashCode ^
      sharedUsers.length.hashCode ^
      assets.length.hashCode;

  static Album local(AssetPathEntity ape) {
    final Album a = Album(
      name: ape.name,
      createdAt: ape.lastModified?.toUtc() ?? DateTime.now().toUtc(),
      modifiedAt: ape.lastModified?.toUtc() ?? DateTime.now().toUtc(),
      shared: false,
      activityEnabled: false,
    );
    a.owner.value = Store.get(StoreKey.currentUser);
    a.localId = ape.id;
    return a;
  }

  static Future<Album> remote(AlbumResponseDto dto) async {
    final Isar db = Isar.getInstance()!;
    final Album a = Album(
      remoteId: dto.id,
      name: dto.albumName,
      createdAt: dto.createdAt,
      modifiedAt: dto.updatedAt,
      lastModifiedAssetTimestamp: dto.lastModifiedAssetTimestamp,
      shared: dto.shared,
      startDate: dto.startDate,
      endDate: dto.endDate,
      activityEnabled: dto.isActivityEnabled,
    );
    a.owner.value = await db.users.getById(dto.ownerId);
    if (dto.albumThumbnailAssetId != null) {
      a.thumbnail.value = await db.assets
          .where()
          .remoteIdEqualTo(dto.albumThumbnailAssetId)
          .findFirst();
    }
    if (dto.sharedUsers.isNotEmpty) {
      final users = await db.users
          .getAllById(dto.sharedUsers.map((e) => e.id).toList(growable: false));
      a.sharedUsers.addAll(users.cast());
    }
    if (dto.assets.isNotEmpty) {
      final assets =
          await db.assets.getAllByRemoteId(dto.assets.map((e) => e.id));
      a.assets.addAll(assets);
    }
    return a;
  }

  @override
  String toString() => name;
}

extension AssetsHelper on IsarCollection<Album> {
  Future<void> store(Album a) async {
    await put(a);
    await a.owner.save();
    await a.thumbnail.save();
    await a.sharedUsers.save();
    await a.assets.save();
  }
}

extension AlbumResponseDtoHelper on AlbumResponseDto {
  List<Asset> getAssets() => assets.map(Asset.remote).toList();
}

extension AssetPathEntityHelper on AssetPathEntity {
  String get eTagKeyAssetCount => "device-album-$id-asset-count";
}
