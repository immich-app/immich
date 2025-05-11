import 'package:flutter/foundation.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/utils/datetime_comparison.dart';
import 'package:isar/isar.dart';
// ignore: implementation_imports
import 'package:isar/src/common/isar_links_common.dart';
import 'package:openapi/api.dart';

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
    this.sortOrder = SortOrder.desc,
  });

  // fields stored in DB
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
  @enumerated
  SortOrder sortOrder;
  final IsarLink<User> owner = IsarLink<User>();
  final IsarLink<Asset> thumbnail = IsarLink<Asset>();
  final IsarLinks<User> sharedUsers = IsarLinks<User>();
  final IsarLinks<Asset> assets = IsarLinks<Asset>();

  // transient fields
  @ignore
  bool isAll = false;

  @ignore
  String? remoteThumbnailAssetId;

  @ignore
  int remoteAssetCount = 0;

  // getters
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

  @ignore
  String get eTagKeyAssetCount => "device-album-$localId-asset-count";

  // the following getter are needed because Isar links do not make data
  // accessible in an object freshly created (not loaded from DB)

  @ignore
  Iterable<User> get remoteUsers => sharedUsers.isEmpty
      ? (sharedUsers as IsarLinksCommon<User>).addedObjects
      : sharedUsers;

  @ignore
  Iterable<Asset> get remoteAssets =>
      assets.isEmpty ? (assets as IsarLinksCommon<Asset>).addedObjects : assets;

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
    a.remoteAssetCount = dto.assetCount;
    a.owner.value = await db.users.getById(dto.ownerId);
    if (dto.order != null) {
      a.sortOrder =
          dto.order == AssetOrder.asc ? SortOrder.asc : SortOrder.desc;
    }

    if (dto.albumThumbnailAssetId != null) {
      a.thumbnail.value = await db.assets
          .where()
          .remoteIdEqualTo(dto.albumThumbnailAssetId)
          .findFirst();
    }
    if (dto.albumUsers.isNotEmpty) {
      final users = await db.users.getAllById(
        dto.albumUsers.map((e) => e.user.id).toList(growable: false),
      );
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
  Future<Album> store(Album a) async {
    await put(a);
    await a.owner.save();
    await a.thumbnail.save();
    await a.sharedUsers.save();
    await a.assets.save();
    return a;
  }
}
