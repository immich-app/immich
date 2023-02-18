import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:path/path.dart' as p;

/// Asset (online or local)
class Asset {
  Asset.remote(AssetResponseDto remote)
      : remoteId = remote.id,
        fileCreatedAt = DateTime.parse(remote.fileCreatedAt),
        fileModifiedAt = DateTime.parse(remote.fileModifiedAt),
        durationInSeconds = remote.duration.toDuration().inSeconds,
        fileName = p.basename(remote.originalPath),
        height = remote.exifInfo?.exifImageHeight?.toInt(),
        width = remote.exifInfo?.exifImageWidth?.toInt(),
        livePhotoVideoId = remote.livePhotoVideoId,
        deviceAssetId = remote.deviceAssetId,
        deviceId = remote.deviceId,
        ownerId = remote.ownerId,
        latitude = remote.exifInfo?.latitude?.toDouble(),
        longitude = remote.exifInfo?.longitude?.toDouble(),
        exifInfo =
            remote.exifInfo != null ? ExifInfo.fromDto(remote.exifInfo!) : null,
        isFavorite = remote.isFavorite;

  Asset.local(AssetEntity local, String owner)
      : localId = local.id,
        latitude = local.latitude,
        longitude = local.longitude,
        durationInSeconds = local.duration,
        height = local.height,
        width = local.width,
        fileName = local.title!,
        deviceAssetId = local.id,
        deviceId = Hive.box(userInfoBox).get(deviceIdKey),
        ownerId = owner,
        fileModifiedAt = local.modifiedDateTime.toUtc(),
        isFavorite = local.isFavorite,
        fileCreatedAt = local.createDateTime.toUtc() {
    if (fileCreatedAt.year == 1970) {
      fileCreatedAt = fileModifiedAt;
    }
  }

  Asset({
    this.localId,
    this.remoteId,
    required this.deviceAssetId,
    required this.deviceId,
    required this.ownerId,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    this.latitude,
    this.longitude,
    required this.durationInSeconds,
    this.width,
    this.height,
    required this.fileName,
    this.livePhotoVideoId,
    this.exifInfo,
    required this.isFavorite,
  });

  AssetEntity? _local;

  AssetEntity? get local {
    if (isLocal && _local == null) {
      _local = AssetEntity(
        id: localId!.toString(),
        typeInt: isImage ? 1 : 2,
        width: width!,
        height: height!,
        duration: durationInSeconds,
        createDateSecond: fileCreatedAt.millisecondsSinceEpoch ~/ 1000,
        latitude: latitude,
        longitude: longitude,
        modifiedDateSecond: fileModifiedAt.millisecondsSinceEpoch ~/ 1000,
        title: fileName,
      );
    }
    return _local;
  }

  String? localId;

  String? remoteId;

  String deviceAssetId;

  String deviceId;

  String ownerId;

  DateTime fileCreatedAt;

  DateTime fileModifiedAt;

  double? latitude;

  double? longitude;

  int durationInSeconds;

  int? width;

  int? height;

  String fileName;

  String? livePhotoVideoId;

  ExifInfo? exifInfo;

  bool isFavorite;

  String get id => isLocal ? localId.toString() : remoteId!;

  String get name => p.withoutExtension(fileName);

  bool get isRemote => remoteId != null;

  bool get isLocal => localId != null;

  bool get isImage => durationInSeconds == 0;

  Duration get duration => Duration(seconds: durationInSeconds);

  @override
  bool operator ==(other) {
    if (other is! Asset) return false;
    return id == other.id && isLocal == other.isLocal;
  }

  @override
  int get hashCode => id.hashCode;

  // methods below are only required for caching as JSON

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json["localId"] = localId;
    json["remoteId"] = remoteId;
    json["deviceAssetId"] = deviceAssetId;
    json["deviceId"] = deviceId;
    json["ownerId"] = ownerId;
    json["fileCreatedAt"] = fileCreatedAt.millisecondsSinceEpoch;
    json["fileModifiedAt"] = fileModifiedAt.millisecondsSinceEpoch;
    json["latitude"] = latitude;
    json["longitude"] = longitude;
    json["durationInSeconds"] = durationInSeconds;
    json["width"] = width;
    json["height"] = height;
    json["fileName"] = fileName;
    json["livePhotoVideoId"] = livePhotoVideoId;
    json["isFavorite"] = isFavorite;
    if (exifInfo != null) {
      json["exifInfo"] = exifInfo!.toJson();
    }
    return json;
  }

  static Asset? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();
      return Asset(
        localId: json["localId"],
        remoteId: json["remoteId"],
        deviceAssetId: json["deviceAssetId"],
        deviceId: json["deviceId"],
        ownerId: json["ownerId"],
        fileCreatedAt:
            DateTime.fromMillisecondsSinceEpoch(json["fileCreatedAt"], isUtc: true),
        fileModifiedAt: DateTime.fromMillisecondsSinceEpoch(
          json["fileModifiedAt"],
          isUtc: true,
        ),
        latitude: json["latitude"],
        longitude: json["longitude"],
        durationInSeconds: json["durationInSeconds"],
        width: json["width"],
        height: json["height"],
        fileName: json["fileName"],
        livePhotoVideoId: json["livePhotoVideoId"],
        exifInfo: ExifInfo.fromJson(json["exifInfo"]),
        isFavorite: json["isFavorite"],
      );
    }
    return null;
  }
}
