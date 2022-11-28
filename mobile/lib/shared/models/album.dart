import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

part 'album.g.dart';

@Collection()
class Album {
  Album(
    this.remoteId,
    this.name,
    this.createdAt,
    this.modifiedAt,
    this.shared,
  );

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
  final IsarLink<Asset> albumThumbnailAsset = IsarLink<Asset>();
  final IsarLinks<User> sharedUsers = IsarLinks<User>();
  final IsarLinks<Asset> assets = IsarLinks<Asset>();

  @ignore
  int get assetCount => assets.length;

  @ignore
  bool get isRemote => remoteId != null;

  @ignore
  bool get isLocal => localId != null;

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
        albumThumbnailAsset.value == other.albumThumbnailAsset.value;
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
      albumThumbnailAsset.value.hashCode;

  static Album fromApe(AssetPathEntity ape, User? owner) {
    final Album a = Album(
      null,
      ape.name,
      ape.lastModified!,
      ape.lastModified!,
      false,
    );
    a.owner.value = owner;
    a.localId = ape.id;
    return a;
  }

  static Future<Album> fromDto(AlbumResponseDto dto, Isar db) async {
    final Album a = Album(
      dto.id,
      dto.albumName,
      DateTime.parse(dto.createdAt),
      DateTime.parse(dto.modifiedAt),
      dto.shared,
    );
    a.owner.value = await db.users.getById(dto.ownerId);
    final users = await db.users
        .getAllById(dto.sharedUsers.map((e) => e.id).toList(growable: false));
    a.sharedUsers.addAll(users.cast());
    a.albumThumbnailAsset.value = await db.assets
        .where()
        .remoteIdEqualTo(dto.albumThumbnailAssetId)
        .findFirst();
    final assets =
        await db.assets.getAllByRemoteId(dto.assets.map((e) => e.id));
    a.assets.addAll(assets);
    return a;
  }
}

extension AssetsHelper on IsarCollection<Album> {
  Future<void> store(Album a) async {
    await put(a);
    await a.sharedUsers.save();
    await a.assets.save();
    await a.owner.save();
    await a.albumThumbnailAsset.save();
  }
}
