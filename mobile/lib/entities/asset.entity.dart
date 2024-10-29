import 'dart:convert';

import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart' show AssetEntity;
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:path/path.dart' as p;

part 'asset.entity.g.dart';

/// Asset (online or local)
@Collection(inheritance: false)
class Asset {
  Asset.remote(AssetResponseDto remote)
      : remoteId = remote.id,
        checksum = remote.checksum,
        fileCreatedAt = remote.fileCreatedAt,
        fileModifiedAt = remote.fileModifiedAt,
        updatedAt = remote.updatedAt,
        durationInSeconds = remote.duration.toDuration()?.inSeconds ?? 0,
        type = remote.type.toAssetType(),
        fileName = remote.originalFileName,
        height = isFlipped(remote)
            ? remote.exifInfo?.exifImageWidth?.toInt()
            : remote.exifInfo?.exifImageHeight?.toInt(),
        width = isFlipped(remote)
            ? remote.exifInfo?.exifImageHeight?.toInt()
            : remote.exifInfo?.exifImageWidth?.toInt(),
        livePhotoVideoId = remote.livePhotoVideoId,
        ownerId = fastHash(remote.ownerId),
        exifInfo =
            remote.exifInfo != null ? ExifInfo.fromDto(remote.exifInfo!) : null,
        isFavorite = remote.isFavorite,
        isArchived = remote.isArchived,
        isTrashed = remote.isTrashed,
        isOffline = remote.isOffline,
        // workaround to nullify stackPrimaryAssetId for the parent asset until we refactor the mobile app
        // stack handling to properly handle it
        stackPrimaryAssetId = remote.stack?.primaryAssetId == remote.id
            ? null
            : remote.stack?.primaryAssetId,
        stackCount = remote.stack?.assetCount ?? 0,
        stackId = remote.stack?.id,
        thumbhash = remote.thumbhash;

  Asset({
    this.id = Isar.autoIncrement,
    required this.checksum,
    this.remoteId,
    required this.localId,
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
    this.isFavorite = false,
    this.isArchived = false,
    this.isTrashed = false,
    this.stackId,
    this.stackPrimaryAssetId,
    this.stackCount = 0,
    this.isOffline = false,
    this.thumbhash,
  });

  @ignore
  AssetEntity? _local;

  @ignore
  AssetEntity? get local {
    if (isLocal && _local == null) {
      _local = AssetEntity(
        id: localId!,
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

  set local(AssetEntity? assetEntity) => _local = assetEntity;

  Id id = Isar.autoIncrement;

  /// stores the raw SHA1 bytes as a base64 String
  /// because Isar cannot sort lists of byte arrays
  String checksum;

  String? thumbhash;

  @Index(unique: false, replace: false, type: IndexType.hash)
  String? remoteId;

  @Index(unique: false, replace: false, type: IndexType.hash)
  String? localId;

  @Index(
    unique: true,
    replace: false,
    composite: [CompositeIndex("checksum", type: IndexType.hash)],
  )
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

  bool isArchived;

  bool isTrashed;

  bool isOffline;

  @ignore
  ExifInfo? exifInfo;

  String? stackId;

  String? stackPrimaryAssetId;

  int stackCount;

  /// Aspect ratio of the asset
  @ignore
  double? get aspectRatio =>
      width == null || height == null ? 0 : width! / height!;

  /// `true` if this [Asset] is present on the device
  @ignore
  bool get isLocal => localId != null;

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

  // ignore: invalid_annotation_target
  @ignore
  set byteHash(List<int> hash) => checksum = base64.encode(hash);

  @override
  bool operator ==(other) {
    if (other is! Asset) return false;
    if (identical(this, other)) return true;
    return id == other.id &&
        checksum == other.checksum &&
        remoteId == other.remoteId &&
        localId == other.localId &&
        ownerId == other.ownerId &&
        fileCreatedAt.isAtSameMomentAs(other.fileCreatedAt) &&
        fileModifiedAt.isAtSameMomentAs(other.fileModifiedAt) &&
        updatedAt.isAtSameMomentAs(other.updatedAt) &&
        durationInSeconds == other.durationInSeconds &&
        type == other.type &&
        width == other.width &&
        height == other.height &&
        fileName == other.fileName &&
        livePhotoVideoId == other.livePhotoVideoId &&
        isFavorite == other.isFavorite &&
        isLocal == other.isLocal &&
        isArchived == other.isArchived &&
        isTrashed == other.isTrashed &&
        stackCount == other.stackCount &&
        stackPrimaryAssetId == other.stackPrimaryAssetId &&
        stackId == other.stackId;
  }

  @override
  @ignore
  int get hashCode =>
      id.hashCode ^
      checksum.hashCode ^
      remoteId.hashCode ^
      localId.hashCode ^
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
      isArchived.hashCode ^
      isTrashed.hashCode ^
      stackCount.hashCode ^
      stackPrimaryAssetId.hashCode ^
      stackId.hashCode;

  /// Returns `true` if this [Asset] can updated with values from parameter [a]
  bool canUpdate(Asset a) {
    assert(isInDb);
    assert(checksum == a.checksum);
    assert(a.storage != AssetState.merged);
    return a.updatedAt.isAfter(updatedAt) ||
        a.isRemote && !isRemote ||
        a.isLocal && !isLocal ||
        width == null && a.width != null ||
        height == null && a.height != null ||
        livePhotoVideoId == null && a.livePhotoVideoId != null ||
        isFavorite != a.isFavorite ||
        isArchived != a.isArchived ||
        isTrashed != a.isTrashed ||
        isOffline != a.isOffline ||
        a.exifInfo?.latitude != exifInfo?.latitude ||
        a.exifInfo?.longitude != exifInfo?.longitude ||
        // no local stack count or different count from remote
        a.thumbhash != thumbhash ||
        stackId != a.stackId ||
        stackCount != a.stackCount ||
        stackPrimaryAssetId == null && a.stackPrimaryAssetId != null;
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
          localId: localId,
          width: a.width ?? width,
          height: a.height ?? height,
          exifInfo: a.exifInfo?.copyWith(id: id) ?? exifInfo,
        );
      } else if (isRemote) {
        return _copyWith(
          localId: localId ?? a.localId,
          width: width ?? a.width,
          height: height ?? a.height,
          exifInfo: exifInfo ?? a.exifInfo?.copyWith(id: id),
        );
      } else {
        // TODO: Revisit this and remove all bool field assignments
        return a._copyWith(
          id: id,
          remoteId: remoteId,
          livePhotoVideoId: livePhotoVideoId,
          // workaround to nullify stackPrimaryAssetId for the parent asset until we refactor the mobile app
          // stack handling to properly handle it
          stackId: stackId,
          stackPrimaryAssetId:
              stackPrimaryAssetId == remoteId ? null : stackPrimaryAssetId,
          stackCount: stackCount,
          isFavorite: isFavorite,
          isArchived: isArchived,
          isTrashed: isTrashed,
          isOffline: isOffline,
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
          // workaround to nullify stackPrimaryAssetId for the parent asset until we refactor the mobile app
          // stack handling to properly handle it
          stackId: a.stackId,
          stackPrimaryAssetId: a.stackPrimaryAssetId == a.remoteId
              ? null
              : a.stackPrimaryAssetId,
          stackCount: a.stackCount,
          // isFavorite + isArchived are not set by device-only assets
          isFavorite: a.isFavorite,
          isArchived: a.isArchived,
          isTrashed: a.isTrashed,
          isOffline: a.isOffline,
          exifInfo: a.exifInfo?.copyWith(id: id) ?? exifInfo,
          thumbhash: a.thumbhash,
        );
      } else {
        // add only missing values (and set isLocal to true)
        return _copyWith(
          localId: localId ?? a.localId,
          width: width ?? a.width,
          height: height ?? a.height,
          exifInfo: exifInfo ?? a.exifInfo?.copyWith(id: id),
        );
      }
    }
  }

  Asset _copyWith({
    Id? id,
    String? checksum,
    String? remoteId,
    String? localId,
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
    bool? isArchived,
    bool? isTrashed,
    bool? isOffline,
    ExifInfo? exifInfo,
    String? stackId,
    String? stackPrimaryAssetId,
    int? stackCount,
    String? thumbhash,
  }) =>
      Asset(
        id: id ?? this.id,
        checksum: checksum ?? this.checksum,
        remoteId: remoteId ?? this.remoteId,
        localId: localId ?? this.localId,
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
        isArchived: isArchived ?? this.isArchived,
        isTrashed: isTrashed ?? this.isTrashed,
        isOffline: isOffline ?? this.isOffline,
        exifInfo: exifInfo ?? this.exifInfo,
        stackId: stackId ?? this.stackId,
        stackPrimaryAssetId: stackPrimaryAssetId ?? this.stackPrimaryAssetId,
        stackCount: stackCount ?? this.stackCount,
        thumbhash: thumbhash ?? this.thumbhash,
      );

  Future<void> put(Isar db) async {
    await db.assets.put(this);
    if (exifInfo != null) {
      exifInfo!.id = id;
      await db.exifInfos.put(exifInfo!);
    }
  }

  static int compareById(Asset a, Asset b) => a.id.compareTo(b.id);

  static int compareByChecksum(Asset a, Asset b) =>
      a.checksum.compareTo(b.checksum);

  static int compareByOwnerChecksum(Asset a, Asset b) {
    final int ownerIdOrder = a.ownerId.compareTo(b.ownerId);
    if (ownerIdOrder != 0) return ownerIdOrder;
    return compareByChecksum(a, b);
  }

  static int compareByOwnerChecksumCreatedModified(
    Asset a,
    Asset b,
  ) {
    final int ownerIdOrder = a.ownerId.compareTo(b.ownerId);
    if (ownerIdOrder != 0) return ownerIdOrder;
    final int checksumOrder = compareByChecksum(a, b);
    if (checksumOrder != 0) return checksumOrder;
    final int createdOrder = a.fileCreatedAt.compareTo(b.fileCreatedAt);
    if (createdOrder != 0) return createdOrder;
    return a.fileModifiedAt.compareTo(b.fileModifiedAt);
  }

  @override
  String toString() {
    return """
{
  "id": ${id == Isar.autoIncrement ? '"N/A"' : id},
  "remoteId": "${remoteId ?? "N/A"}",
  "localId": "${localId ?? "N/A"}",
  "checksum": "$checksum",
  "ownerId": $ownerId,
  "livePhotoVideoId": "${livePhotoVideoId ?? "N/A"}",
  "stackId": "${stackId ?? "N/A"}",
  "stackPrimaryAssetId": "${stackPrimaryAssetId ?? "N/A"}",
  "stackCount": "$stackCount",
  "fileCreatedAt": "$fileCreatedAt",
  "fileModifiedAt": "$fileModifiedAt",
  "updatedAt": "$updatedAt",
  "durationInSeconds": $durationInSeconds,
  "type": "$type",
  "fileName": "$fileName",
  "isFavorite": $isFavorite,
  "isRemote": $isRemote,
  "storage": "$storage",
  "width": ${width ?? "N/A"},
  "height": ${height ?? "N/A"},
  "isArchived": $isArchived,
  "isTrashed": $isTrashed,
  "isOffline": $isOffline,
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
      ids.isEmpty ? Future.value(0) : remote(ids).deleteAll();
  Future<int> deleteAllByLocalId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value(0) : local(ids).deleteAll();
  Future<List<Asset>> getAllByRemoteId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value([]) : remote(ids).findAll();
  Future<List<Asset>> getAllByLocalId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value([]) : local(ids).findAll();
  Future<Asset?> getByRemoteId(String id) =>
      where().remoteIdEqualTo(id).findFirst();

  QueryBuilder<Asset, Asset, QAfterWhereClause> remote(
    Iterable<String> ids,
  ) =>
      where().anyOf(ids, (q, String e) => q.remoteIdEqualTo(e));
  QueryBuilder<Asset, Asset, QAfterWhereClause> local(
    Iterable<String> ids,
  ) {
    return where().anyOf(ids, (q, String e) => q.localIdEqualTo(e));
  }
}

/// Returns `true` if this [int] is flipped 90° clockwise
bool isRotated90CW(int orientation) {
  return [7, 8, -90].contains(orientation);
}

/// Returns `true` if this [int] is flipped 270° clockwise
bool isRotated270CW(int orientation) {
  return [5, 6, 90].contains(orientation);
}

/// Returns `true` if this [Asset] is flipped 90° or 270° clockwise
bool isFlipped(AssetResponseDto response) {
  final int orientation = response.exifInfo?.orientation?.toInt() ?? 0;
  return orientation != 0 &&
      (isRotated90CW(orientation) || isRotated270CW(orientation));
}
