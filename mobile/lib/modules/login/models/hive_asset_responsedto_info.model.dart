import 'package:hive_flutter/hive_flutter.dart';
import 'package:openapi/api.dart';

part 'hive_asset_responsedto_info.model.g.dart';

@HiveType(typeId: 3)
class AssetResponseDto {
  @override
  @HiveField(0)
  final AssetTypeEnum type;
  @HiveField(1)
  final String id;
  @HiveField(2)
  final String createdAt;
  @HiveField(3)
  final String deviceAssetId;
  @HiveField(4)
  final String ownerId;
  @HiveField(5)
  final String deviceId;
  @HiveField(6)
  final String originalPath;
  @HiveField(7)
  final String resizePath;
  @HiveField(8)
  final String modifiedAt;
  @HiveField(9)
  final bool isFavorite;
  @HiveField(10)
  final String? mimeType;
  @HiveField(11)
  final String duration;
  @HiveField(12)
  final String? webpPath;
  @HiveField(13)
  final String? encodedVideoPath;

  AssetResponseDto(
    this.type,
    this.id,
    this.createdAt,
    this.deviceAssetId,
    this.ownerId,
    this.deviceId,
    this.originalPath,
    this.resizePath,
    this.modifiedAt,
    this.isFavorite,
    this.mimeType,
    this.duration,
    this.webpPath,
    this.encodedVideoPath,
  );
}
