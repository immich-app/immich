import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/asset.android.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:path/path.dart' as p;
// ignore: unused_import
import 'package:immich_mobile/shared/models/asset.base.dart'
    if (Platform.isAndroid) 'package:immich_mobile/shared/models/asset.android.dart'
    if (Platform.isIOS) 'package:immich_mobile/shared/models/asset.ios.dart';

part 'asset.g.dart';

typedef LocalId = BaseLocalId;

/// Asset (online or local)
@Collection()
class Asset extends BaseAsset {
  Asset.remote(AssetResponseDto? remote)
      : remoteId = remote!.id,
        createdAt = DateTime.parse(remote.createdAt),
        modifiedAt = DateTime.parse(remote.modifiedAt),
        durationInSeconds = remote.duration.toDuration().inSeconds,
        name = remote.exifInfo == null
            ? p.basenameWithoutExtension(remote.originalPath)
            : remote.exifInfo!.imageName,
        height = remote.exifInfo?.exifImageHeight?.toInt(),
        width = remote.exifInfo?.exifImageWidth?.toInt(),
        originalExtension = p.extension(remote.originalPath),
        livePhotoVideoId = remote.livePhotoVideoId,
        deviceAssetId = remote.deviceAssetId,
        deviceId = remote.deviceId,
        ownerId = remote.ownerId,
        latitude = remote.exifInfo?.latitude?.toDouble(),
        longitude = remote.exifInfo?.longitude?.toDouble(),
        exifInfo =
            remote.exifInfo != null ? ExifInfo.fromDto(remote.exifInfo!) : null,
        super(null);

  Asset.local(AssetEntity? local, String owner)
      : latitude = local!.latitude,
        longitude = local.longitude,
        durationInSeconds = local.duration,
        height = local.height,
        width = local.width,
        name = local.title != null ? p.withoutExtension(local.title!) : null,
        originalExtension =
            local.title != null ? p.extension(local.title!) : null,
        deviceAssetId = local.id,
        deviceId = Hive.box(userInfoBox).get(deviceIdKey),
        ownerId = owner,
        modifiedAt = local.modifiedDateTime,
        createdAt = local.createDateTime,
        super(int.parse(local.id));

  Asset(
    this.id,
    this.createdAt,
    this.durationInSeconds,
    this.modifiedAt,
    this.deviceAssetId,
    this.deviceId,
    this.ownerId,
  ) : super(null);

  @ignore
  AssetEntity? get local {
    if (isLocal && _local == null) {
      _local = AssetEntity(
        id: localId!.toString(),
        typeInt: isImage ? 1 : 2,
        width: width!,
        height: height!,
        duration: durationInSeconds,
        createDateSecond: createdAt.millisecondsSinceEpoch ~/ 1000,
        latitude: latitude,
        longitude: longitude,
        modifiedDateSecond: modifiedAt.millisecondsSinceEpoch ~/ 1000,
        title: name,
      );
    }
    return _local;
  }

  @ignore
  AssetEntity? _local;

  Id id = Isar.autoIncrement;

  @Index(unique: false, replace: false, type: IndexType.hash)
  String? remoteId;

  @Index(
    unique: true,
    replace: false,
    type: IndexType.hash,
    composite: [CompositeIndex('deviceId', type: IndexType.hash)],
  )
  String deviceAssetId;

  String deviceId;

  String ownerId;

  DateTime createdAt;

  DateTime modifiedAt;

  double? latitude;

  double? longitude;

  int durationInSeconds;

  int? width;

  int? height;

  String? name;

  String? originalExtension;

  String? livePhotoVideoId;

  ExifInfo? exifInfo;

  @ignore
  bool get isInDb => id != Isar.autoIncrement;

  @ignore
  bool get isRemote => remoteId != null;

  @ignore
  bool get isLocal => localId != null; // && width != null && height != null;

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

  bool updateFromLocal(AssetEntity ae) {
    Asset a = Asset.local(ae, ownerId);
    // TODO check more fields;
    // width and height are most important because local assets require these
    final bool hasChanges = width != a.width || height != a.height;
    if (hasChanges) {
      width = a.width;
      height = a.height;
    }
    return hasChanges;
  }
}

@embedded
class ExifInfo {
  int? fileSize;
  String? make;
  String? model;
  String? orientation;
  String? lensModel;
  double? fNumber;
  double? focalLength;
  int? iso;
  double? exposureTime;
  DateTime? dateTimeOriginal;
  DateTime? modifyDate;
  String? city;
  String? state;
  String? country;

  ExifInfo();

  ExifInfo.fromDto(ExifResponseDto dto)
      : fileSize = dto.fileSizeInByte,
        make = dto.make,
        model = dto.model,
        orientation = dto.orientation,
        lensModel = dto.lensModel,
        fNumber = dto.fNumber?.toDouble(),
        focalLength = dto.focalLength?.toDouble(),
        iso = dto.iso?.toInt(),
        exposureTime = dto.exposureTime?.toDouble(),
        dateTimeOriginal = dto.dateTimeOriginal,
        modifyDate = dto.modifyDate,
        city = dto.city,
        state = dto.state,
        country = dto.country;
}

extension AssetsHelper on IsarCollection<Asset> {
  Future<int> deleteAllByRemoteId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value(0) : _remote(ids).deleteAll();
  Future<int> deleteAllByLocalId(Iterable<LocalId> ids) =>
      ids.isEmpty ? Future.value(0) : _local(ids).deleteAll();
  Future<List<Asset>> getAllByRemoteId(Iterable<String> ids) =>
      ids.isEmpty ? Future.value([]) : _remote(ids).findAll();
  Future<List<Asset>> getAllByLocalId(Iterable<LocalId> ids) =>
      ids.isEmpty ? Future.value([]) : _local(ids).findAll();

  QueryBuilder<Asset, Asset, QAfterWhereClause> _remote(Iterable<String> ids) =>
      where().anyOf(ids, (q, String e) => q.remoteIdEqualTo(e));
  QueryBuilder<Asset, Asset, QAfterWhereClause> _local(Iterable<LocalId> ids) {
    return where().anyOf(ids, (q, LocalId e) => q.localIdEqualTo(e));
  }
}

extension AssetResponseDtoHelper on AssetResponseDto {
  LocalId get localId => localIdFromString(deviceAssetId);
}

extension AssetEntityHelper on AssetEntity {
  LocalId get localId => localIdFromString(id);
}

extension AssetIdHelper on String {
  LocalId get asLocalId => localIdFromString(this);
}
