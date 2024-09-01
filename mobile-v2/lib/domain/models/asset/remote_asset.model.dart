import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/utils/extensions/string.extension.dart';
import 'package:openapi/api.dart';

@immutable
class RemoteAsset extends Asset {
  final String remoteId;
  final String? livePhotoVideoId;

  const RemoteAsset({
    required this.remoteId,
    required super.name,
    required super.checksum,
    required super.height,
    required super.width,
    required super.type,
    required super.createdTime,
    required super.modifiedTime,
    required super.duration,
    this.livePhotoVideoId,
  });

  @override
  String toString() => """
{
  "remoteId": "$remoteId",
  "name": "$name",
  "checksum": "$checksum",
  "height": ${height ?? "-"},
  "width": ${width ?? "-"},
  "type": "$type",
  "createdTime": "$createdTime",
  "modifiedTime": "$modifiedTime",
  "duration": "$duration",
  "livePhotoVideoId": "${livePhotoVideoId ?? "-"}",
}""";

  @override
  bool operator ==(covariant RemoteAsset other) {
    if (identical(this, other)) return true;

    return super == (other) && other.remoteId == remoteId;
  }

  @override
  int get hashCode => super.hashCode ^ remoteId.hashCode;

  @override
  RemoteAsset copyWith({
    String? remoteId,
    String? name,
    String? checksum,
    int? height,
    int? width,
    AssetType? type,
    DateTime? createdTime,
    DateTime? modifiedTime,
    int? duration,
    String? livePhotoVideoId,
  }) {
    return RemoteAsset(
      remoteId: remoteId ?? this.remoteId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      height: height ?? this.height,
      width: width ?? this.width,
      type: type ?? this.type,
      createdTime: createdTime ?? this.createdTime,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      duration: duration ?? this.duration,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
    );
  }

  factory RemoteAsset.fromDto(AssetResponseDto dto) => RemoteAsset(
        remoteId: dto.id,
        createdTime: dto.fileCreatedAt,
        duration: dto.duration.tryParseInt() ?? 0,
        height: dto.exifInfo?.exifImageHeight?.toInt(),
        width: dto.exifInfo?.exifImageWidth?.toInt(),
        checksum: dto.checksum,
        name: dto.originalFileName,
        livePhotoVideoId: dto.livePhotoVideoId,
        modifiedTime: dto.fileModifiedAt,
        type: _toAssetType(dto.type),
      );
}

AssetType _toAssetType(AssetTypeEnum type) => switch (type) {
      AssetTypeEnum.AUDIO => AssetType.audio,
      AssetTypeEnum.IMAGE => AssetType.image,
      AssetTypeEnum.VIDEO => AssetType.video,
      _ => AssetType.other,
    };
