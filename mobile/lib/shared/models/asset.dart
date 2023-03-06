import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:path/path.dart' as p;

part 'asset.g.dart';

/// Asset (online or local)
@Collection(inheritance: false)
class Asset {
  Asset.remote(AssetResponseDto remote)
      : remoteId = remote.id,
        isLocal = false,
        fileCreatedAt = DateTime.parse(remote.fileCreatedAt).toUtc(),
        fileModifiedAt = DateTime.parse(remote.fileModifiedAt).toUtc(),
        updatedAt = DateTime.parse(remote.updatedAt).toUtc(),
        // use -1 as fallback duration (to not mix it up with non-video assets correctly having duration=0)
        durationInSeconds = remote.duration.toDuration()?.inSeconds ?? -1,
        fileName = p.basename(remote.originalPath),
        height = remote.exifInfo?.exifImageHeight?.toInt(),
        width = remote.exifInfo?.exifImageWidth?.toInt(),
        livePhotoVideoId = remote.livePhotoVideoId,
        localId = remote.deviceAssetId,
        deviceId = fastHash(remote.deviceId),
        ownerId = fastHash(remote.ownerId),
        exifInfo =
            remote.exifInfo != null ? ExifInfo.fromDto(remote.exifInfo!) : null,
        isFavorite = remote.isFavorite;

  Asset.local(AssetEntity local)
      : localId = local.id,
        isLocal = true,
        durationInSeconds = local.duration,
        height = local.height,
        width = local.width,
        fileName = local.title!,
        deviceId = Store.get(StoreKey.deviceIdHash),
        ownerId = Store.get<User>(StoreKey.currentUser)!.isarId,
        fileModifiedAt = local.modifiedDateTime.toUtc(),
        updatedAt = local.modifiedDateTime.toUtc(),
        isFavorite = local.isFavorite,
        fileCreatedAt = local.createDateTime.toUtc() {
    if (fileCreatedAt.year == 1970) {
      fileCreatedAt = fileModifiedAt;
    }
    if (local.latitude != null) {
      exifInfo = ExifInfo(lat: local.latitude, long: local.longitude);
    }
  }

  Asset({
    this.remoteId,
    required this.localId,
    required this.deviceId,
    required this.ownerId,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.updatedAt,
    required this.durationInSeconds,
    this.width,
    this.height,
    required this.fileName,
    this.livePhotoVideoId,
    this.exifInfo,
    required this.isFavorite,
    required this.isLocal,
  });

  @ignore
  AssetEntity? _local;

  @ignore
  AssetEntity? get local {
    if (isLocal && _local == null) {
      _local = AssetEntity(
        id: localId.toString(),
        typeInt: isImage ? 1 : 2,
        width: width!,
        height: height!,
        duration: durationInSeconds,
        createDateSecond: fileCreatedAt.millisecondsSinceEpoch ~/ 1000,
        modifiedDateSecond: fileModifiedAt.millisecondsSinceEpoch ~/ 1000,
        title: fileName,
      );
    }
    return _local;
  }

  Id id = Isar.autoIncrement;

  @Index(unique: false, replace: false, type: IndexType.hash)
  String? remoteId;

  @Index(
    unique: true,
    replace: false,
    type: IndexType.hash,
    composite: [CompositeIndex('deviceId')],
  )
  String localId;

  int deviceId;

  int ownerId;

  DateTime fileCreatedAt;

  DateTime fileModifiedAt;

  DateTime updatedAt;

  int durationInSeconds;

  short? width;

  short? height;

  String fileName;

  String? livePhotoVideoId;

  bool isFavorite;

  bool isLocal;

  @ignore
  ExifInfo? exifInfo;

  @ignore
  bool get isInDb => id != Isar.autoIncrement;

  @ignore
  String get name => p.withoutExtension(fileName);

  @ignore
  bool get isRemote => remoteId != null;

  @ignore
  bool get isImage => durationInSeconds == 0;

  @ignore
  Duration get duration => Duration(seconds: durationInSeconds);

  @override
  bool operator ==(other) {
    if (other is! Asset) return false;
    return id == other.id;
  }

  @override
  @ignore
  int get hashCode => id.hashCode;

  bool updateFromAssetEntity(AssetEntity ae) {
    // TODO check more fields;
    // width and height are most important because local assets require these
    final bool hasChanges =
        isLocal == false || width != ae.width || height != ae.height;
    if (hasChanges) {
      isLocal = true;
      width = ae.width;
      height = ae.height;
    }
    return hasChanges;
  }

  Asset withUpdatesFromDto(AssetResponseDto dto) =>
      Asset.remote(dto).updateFromDb(this);

  Asset updateFromDb(Asset a) {
    assert(localId == a.localId);
    assert(deviceId == a.deviceId);
    id = a.id;
    isLocal |= a.isLocal;
    remoteId ??= a.remoteId;
    width ??= a.width;
    height ??= a.height;
    exifInfo ??= a.exifInfo;
    exifInfo?.id = id;
    return this;
  }

  Future<void> put(Isar db) async {
    await db.assets.put(this);
    if (exifInfo != null) {
      exifInfo!.id = id;
      await db.exifInfos.put(exifInfo!);
    }
  }

  static int compareByDeviceIdLocalId(Asset a, Asset b) {
    final int order = a.deviceId.compareTo(b.deviceId);
    return order == 0 ? a.localId.compareTo(b.localId) : order;
  }

  static int compareById(Asset a, Asset b) => a.id.compareTo(b.id);

  static int compareByLocalId(Asset a, Asset b) =>
      a.localId.compareTo(b.localId);
}

extension AssetsHelper on IsarCollection<Asset> {
  Future<int> deleteAllByRemoteId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value(0) : _remote(ids).deleteAll();
  Future<int> deleteAllByLocalId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value(0) : _local(ids).deleteAll();
  Future<List<Asset>> getAllByRemoteId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value([]) : _remote(ids).findAll();
  Future<List<Asset>> getAllByLocalId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value([]) : _local(ids).findAll();

  QueryBuilder<Asset, Asset, QAfterWhereClause> _remote(Iterable<String> ids) =>
      where().anyOf(ids, (q, String e) => q.remoteIdEqualTo(e));
  QueryBuilder<Asset, Asset, QAfterWhereClause> _local(Iterable<String> ids) {
    return where().anyOf(
      ids,
      (q, String e) =>
          q.localIdDeviceIdEqualTo(e, Store.get(StoreKey.deviceIdHash)),
    );
  }
}
