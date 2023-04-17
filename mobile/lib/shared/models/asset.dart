import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
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
        fileCreatedAt = DateTime.parse(remote.fileCreatedAt),
        fileModifiedAt = DateTime.parse(remote.fileModifiedAt),
        updatedAt = DateTime.parse(remote.updatedAt),
        durationInSeconds = remote.duration.toDuration()?.inSeconds ?? 0,
        type = remote.type.toAssetType(),
        fileName = p.basename(remote.originalPath),
        height = remote.exifInfo?.exifImageHeight?.toInt(),
        width = remote.exifInfo?.exifImageWidth?.toInt(),
        livePhotoVideoId = remote.livePhotoVideoId,
        localId = remote.deviceAssetId,
        deviceId = fastHash(remote.deviceId),
        ownerId = fastHash(remote.ownerId),
        exifInfo =
            remote.exifInfo != null ? ExifInfo.fromDto(remote.exifInfo!) : null,
        isFavorite = remote.isFavorite,
        isArchived = remote.isArchived;

  Asset.local(AssetEntity local)
      : localId = local.id,
        isLocal = true,
        durationInSeconds = local.duration,
        type = AssetType.values[local.typeInt],
        height = local.height,
        width = local.width,
        fileName = local.title!,
        deviceId = Store.get(StoreKey.deviceIdHash),
        ownerId = Store.get(StoreKey.currentUser).isarId,
        fileModifiedAt = local.modifiedDateTime,
        updatedAt = local.modifiedDateTime,
        isFavorite = local.isFavorite,
        isArchived = false,
        fileCreatedAt = local.createDateTime {
    if (fileCreatedAt.year == 1970) {
      fileCreatedAt = fileModifiedAt;
    }
    if (local.latitude != null) {
      exifInfo = ExifInfo(lat: local.latitude, long: local.longitude);
    }
  }

  Asset({
    this.id = Isar.autoIncrement,
    this.remoteId,
    required this.localId,
    required this.deviceId,
    required this.ownerId,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.updatedAt,
    required this.durationInSeconds,
    required this.type,
    this.width,
    this.height,
    required this.fileName,
    this.livePhotoVideoId,
    this.exifInfo,
    required this.isFavorite,
    required this.isLocal,
    required this.isArchived,
  });

  @ignore
  AssetEntity? _local;

  @ignore
  AssetEntity? get local {
    if (isLocal && _local == null) {
      _local = AssetEntity(
        id: localId,
        typeInt: isImage ? 1 : 2,
        width: width ?? 0,
        height: height ?? 0,
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
    unique: false,
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

  @Enumerated(EnumType.ordinal)
  AssetType type;

  short? width;

  short? height;

  String fileName;

  String? livePhotoVideoId;

  bool isFavorite;

  /// `true` if this [Asset] is present on the device
  bool isLocal;

  bool isArchived;

  @ignore
  ExifInfo? exifInfo;

  @ignore
  bool get isInDb => id != Isar.autoIncrement;

  @ignore
  String get name => p.withoutExtension(fileName);

  /// `true` if this [Asset] is present on the server
  @ignore
  bool get isRemote => remoteId != null;

  @ignore
  bool get isImage => type == AssetType.image;

  @ignore
  AssetState get storage {
    if (isRemote && isLocal) {
      return AssetState.merged;
    } else if (isRemote) {
      return AssetState.remote;
    } else if (isLocal) {
      return AssetState.local;
    } else {
      throw Exception("Asset has illegal state: $this");
    }
  }

  @ignore
  Duration get duration => Duration(seconds: durationInSeconds);

  @override
  bool operator ==(other) {
    if (other is! Asset) return false;
    return id == other.id &&
        remoteId == other.remoteId &&
        localId == other.localId &&
        deviceId == other.deviceId &&
        ownerId == other.ownerId &&
        fileCreatedAt == other.fileCreatedAt &&
        fileModifiedAt == other.fileModifiedAt &&
        updatedAt == other.updatedAt &&
        durationInSeconds == other.durationInSeconds &&
        type == other.type &&
        width == other.width &&
        height == other.height &&
        fileName == other.fileName &&
        livePhotoVideoId == other.livePhotoVideoId &&
        isFavorite == other.isFavorite &&
        isLocal == other.isLocal &&
        isArchived == other.isArchived;
  }

  @override
  @ignore
  int get hashCode =>
      id.hashCode ^
      remoteId.hashCode ^
      localId.hashCode ^
      deviceId.hashCode ^
      ownerId.hashCode ^
      fileCreatedAt.hashCode ^
      fileModifiedAt.hashCode ^
      updatedAt.hashCode ^
      durationInSeconds.hashCode ^
      type.hashCode ^
      width.hashCode ^
      height.hashCode ^
      fileName.hashCode ^
      livePhotoVideoId.hashCode ^
      isFavorite.hashCode ^
      isLocal.hashCode ^
      isArchived.hashCode;

  /// Returns `true` if this [Asset] can updated with values from parameter [a]
  bool canUpdate(Asset a) {
    assert(isInDb);
    assert(localId == a.localId);
    assert(deviceId == a.deviceId);
    assert(a.storage != AssetState.merged);
    return a.updatedAt.isAfter(updatedAt) ||
        a.isRemote && !isRemote ||
        a.isLocal && !isLocal ||
        width == null && a.width != null ||
        height == null && a.height != null ||
        exifInfo == null && a.exifInfo != null ||
        livePhotoVideoId == null && a.livePhotoVideoId != null ||
        !isRemote && a.isRemote && isFavorite != a.isFavorite ||
        !isRemote && a.isRemote && isArchived != a.isArchived;
  }

  /// Returns a new [Asset] with values from this and merged & updated with [a]
  Asset updatedCopy(Asset a) {
    assert(canUpdate(a));
    if (a.updatedAt.isAfter(updatedAt)) {
      // take most values from newer asset
      // keep vales that can never be set by the asset not in DB
      if (a.isRemote) {
        return a._copyWith(
          id: id,
          isLocal: isLocal,
          width: a.width ?? width,
          height: a.height ?? height,
          exifInfo: a.exifInfo?.copyWith(id: id) ?? exifInfo,
        );
      } else {
        return a._copyWith(
          id: id,
          remoteId: remoteId,
          livePhotoVideoId: livePhotoVideoId,
          isFavorite: isFavorite,
          isArchived: isArchived,
        );
      }
    } else {
      // fill in potentially missing values, i.e. merge assets
      if (a.isRemote) {
        // values from remote take precedence
        return _copyWith(
          remoteId: a.remoteId,
          width: a.width,
          height: a.height,
          livePhotoVideoId: a.livePhotoVideoId,
          // isFavorite + isArchived are not set by device-only assets
          isFavorite: a.isFavorite,
          isArchived: a.isArchived,
          exifInfo: a.exifInfo?.copyWith(id: id) ?? exifInfo,
        );
      } else {
        // add only missing values (and set isLocal to true)
        return _copyWith(
          isLocal: true,
          width: width ?? a.width,
          height: height ?? a.height,
          exifInfo: exifInfo ?? a.exifInfo?.copyWith(id: id),
        );
      }
    }
  }

  Asset _copyWith({
    Id? id,
    String? remoteId,
    String? localId,
    int? deviceId,
    int? ownerId,
    DateTime? fileCreatedAt,
    DateTime? fileModifiedAt,
    DateTime? updatedAt,
    int? durationInSeconds,
    AssetType? type,
    short? width,
    short? height,
    String? fileName,
    String? livePhotoVideoId,
    bool? isFavorite,
    bool? isLocal,
    bool? isArchived,
    ExifInfo? exifInfo,
  }) =>
      Asset(
        id: id ?? this.id,
        remoteId: remoteId ?? this.remoteId,
        localId: localId ?? this.localId,
        deviceId: deviceId ?? this.deviceId,
        ownerId: ownerId ?? this.ownerId,
        fileCreatedAt: fileCreatedAt ?? this.fileCreatedAt,
        fileModifiedAt: fileModifiedAt ?? this.fileModifiedAt,
        updatedAt: updatedAt ?? this.updatedAt,
        durationInSeconds: durationInSeconds ?? this.durationInSeconds,
        type: type ?? this.type,
        width: width ?? this.width,
        height: height ?? this.height,
        fileName: fileName ?? this.fileName,
        livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
        isFavorite: isFavorite ?? this.isFavorite,
        isLocal: isLocal ?? this.isLocal,
        isArchived: isArchived ?? this.isArchived,
        exifInfo: exifInfo ?? this.exifInfo,
      );

  Future<void> put(Isar db) async {
    await db.assets.put(this);
    if (exifInfo != null) {
      exifInfo!.id = id;
      await db.exifInfos.put(exifInfo!);
    }
  }

  /// compares assets by [ownerId], [deviceId], [localId]
  static int compareByOwnerDeviceLocalId(Asset a, Asset b) {
    final int ownerIdOrder = a.ownerId.compareTo(b.ownerId);
    if (ownerIdOrder != 0) {
      return ownerIdOrder;
    }
    final int deviceIdOrder = a.deviceId.compareTo(b.deviceId);
    if (deviceIdOrder != 0) {
      return deviceIdOrder;
    }
    final int localIdOrder = a.localId.compareTo(b.localId);
    return localIdOrder;
  }

  /// compares assets by [ownerId], [deviceId], [localId], [fileModifiedAt]
  static int compareByOwnerDeviceLocalIdModified(Asset a, Asset b) {
    final int order = compareByOwnerDeviceLocalId(a, b);
    return order != 0 ? order : a.fileModifiedAt.compareTo(b.fileModifiedAt);
  }

  static int compareById(Asset a, Asset b) => a.id.compareTo(b.id);

  static int compareByLocalId(Asset a, Asset b) =>
      a.localId.compareTo(b.localId);

  @override
  String toString() {
    return """
{
  "remoteId": "${remoteId ?? "N/A"}",
  "localId": "$localId", 
  "deviceId": "$deviceId", 
  "ownerId": "$ownerId", 
  "livePhotoVideoId": "${livePhotoVideoId ?? "N/A"}",
  "fileCreatedAt": "$fileCreatedAt",
  "fileModifiedAt": "$fileModifiedAt", 
  "updatedAt": "$updatedAt", 
  "durationInSeconds": $durationInSeconds, 
  "type": "$type",
  "fileName": "$fileName", 
  "isFavorite": $isFavorite, 
  "isLocal": $isLocal,
  "width": ${width ?? "N/A"},
  "height": ${height ?? "N/A"},
  "isArchived": $isArchived
}""";
  }
}

enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

extension AssetTypeEnumHelper on AssetTypeEnum {
  AssetType toAssetType() {
    switch (this) {
      case AssetTypeEnum.IMAGE:
        return AssetType.image;
      case AssetTypeEnum.VIDEO:
        return AssetType.video;
      case AssetTypeEnum.AUDIO:
        return AssetType.audio;
      case AssetTypeEnum.OTHER:
        return AssetType.other;
    }
    throw Exception();
  }
}

/// Describes where the information of this asset came from:
/// only from the local device, only from the remote server or merged from both
enum AssetState {
  local,
  remote,
  merged,
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
