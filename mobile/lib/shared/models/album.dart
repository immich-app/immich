import 'package:flutter/cupertino.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

part 'album.g.dart';

@Collection(inheritance: false)
class Album {
  @protected
  Album({
    this.remoteId,
    this.localId,
    required this.name,
    required this.createdAt,
    required this.modifiedAt,
    required this.shared,
  });

  Id id = Isar.autoIncrement;
  @Index(unique: false, replace: false, type: IndexType.hash)
  String? remoteId;
  @Index(unique: false, replace: false, type: IndexType.hash)
  String? localId;
  String name;
  DateTime createdAt;
  DateTime modifiedAt;
  bool shared;
  final IsarLink<User> owner = IsarLink<User>();
  final IsarLink<Asset> thumbnail = IsarLink<Asset>();
  final IsarLinks<User> sharedUsers = IsarLinks<User>();
  final IsarLinks<Asset> assets = IsarLinks<Asset>();

  List<Asset> _sortedAssets = [];

  @ignore
  List<Asset> get sortedAssets => _sortedAssets;

  @ignore
  bool get isRemote => remoteId != null;

  @ignore
  bool get isLocal => localId != null;

  @ignore
  int get assetCount => assets.length;

  @ignore
  String? get ownerId => owner.value?.id;

  Future<void> loadSortedAssets() async {
    _sortedAssets = await assets.filter().sortByFileCreatedAt().findAll();
  }

  @override
  bool operator ==(other) {
    if (other is! Album) return false;
    return id == other.id &&
        remoteId == other.remoteId &&
        localId == other.localId &&
        name == other.name &&
        createdAt == other.createdAt &&
        modifiedAt == other.modifiedAt &&
        shared == other.shared &&
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
      shared.hashCode ^
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
      createdAt: DateTime.parse(dto.createdAt),
      modifiedAt: DateTime.parse(dto.updatedAt),
      shared: dto.shared,
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

extension AssetPathEntityHelper on AssetPathEntity {
  Future<List<Asset>> getAssets({
    int start = 0,
    int end = 0x7fffffffffffffff,
  }) async {
    final assetEntities = await getAssetListRange(start: start, end: end);
    return assetEntities.map(Asset.local).toList();
  }
}

extension AlbumResponseDtoHelper on AlbumResponseDto {
  List<Asset> getAssets() => assets.map(Asset.remote).toList();
}
