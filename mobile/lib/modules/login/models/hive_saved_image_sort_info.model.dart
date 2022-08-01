import 'package:hive/hive.dart';
import 'package:openapi/api.dart';

part 'hive_saved_image_sort_info.model.g.dart';

@HiveType(typeId: 2)
class HiveSavedImageSortInfo {
  @HiveField(0)
  final List<AssetResponseDto> list;

  HiveSavedImageSortInfo({required this.list});
  // HiveSavedImageSortInfo(
  //     {required super.type,
  //     required super.id,
  //     required super.deviceAssetId,
  //     required super.ownerId,
  //     required super.deviceId,
  //     required super.originalPath,
  //     required super.resizePath,
  //     required super.createdAt,
  //     required super.modifiedAt,
  //     required super.isFavorite,
  //     required super.mimeType,
  //     required super.duration,
  //     required super.webpPath,
  //     required super.encodedVideoPath});
}

//  HiveSavedImageSortInfo({required this.list});
  // HiveSavedImageSortInfo(
  //     {required super.type,
  //     required super.id,
  //     required super.deviceAssetId,
  //     required super.ownerId,
  //     required super.deviceId,
  //     required super.originalPath,
  //     required super.resizePath,
  //     required super.createdAt,
  //     required super.modifiedAt,
  //     required super.isFavorite,
  //     required super.mimeType,
  //     required super.duration,
  //     required super.webpPath,
  //     required super.encodedVideoPath});