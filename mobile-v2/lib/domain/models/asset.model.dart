import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/collection_util.dart';
import 'package:immich_mobile/utils/extensions/string.extension.dart';
import 'package:openapi/api.dart';

enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

class Asset {
  final int id;
  final String name;
  final String hash;
  final int? height;
  final int? width;
  final AssetType type;
  final DateTime createdTime;
  final DateTime modifiedTime;
  final int duration;

  // local only
  final String? localId;

  // remote only
  final String? remoteId;
  final String? livePhotoVideoId;

  bool get isRemote => remoteId != null;
  bool get isLocal => localId != null;
  bool get isMerged => isRemote && isLocal;

  const Asset({
    required this.id,
    required this.name,
    required this.hash,
    this.height,
    this.width,
    required this.type,
    required this.createdTime,
    required this.modifiedTime,
    required this.duration,
    this.localId,
    this.remoteId,
    this.livePhotoVideoId,
  });

  factory Asset.remote(AssetResponseDto dto) => Asset(
        id: 0, // assign a temporary auto gen ID
        remoteId: dto.id,
        createdTime: dto.fileCreatedAt,
        duration: dto.duration.tryParseInt() ?? 0,
        height: dto.exifInfo?.exifImageHeight?.toInt(),
        width: dto.exifInfo?.exifImageWidth?.toInt(),
        hash: dto.checksum,
        name: dto.originalFileName,
        livePhotoVideoId: dto.livePhotoVideoId,
        modifiedTime: dto.fileModifiedAt,
        type: _toAssetType(dto.type),
      );

  Asset copyWith({
    int? id,
    String? name,
    String? hash,
    int? height,
    int? width,
    AssetType? type,
    DateTime? createdTime,
    DateTime? modifiedTime,
    int? duration,
    ValueGetter<String?>? localId,
    ValueGetter<String?>? remoteId,
    String? livePhotoVideoId,
  }) {
    return Asset(
      id: id ?? this.id,
      name: name ?? this.name,
      hash: hash ?? this.hash,
      height: height ?? this.height,
      width: width ?? this.width,
      type: type ?? this.type,
      createdTime: createdTime ?? this.createdTime,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      duration: duration ?? this.duration,
      localId: localId != null ? localId() : this.localId,
      remoteId: remoteId != null ? remoteId() : this.remoteId,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
    );
  }

  Asset merge(Asset newAsset) {
    if (newAsset.modifiedTime.isAfter(modifiedTime)) {
      return newAsset.copyWith(
        height: newAsset.height ?? height,
        width: newAsset.width ?? width,
        localId: () => newAsset.localId ?? localId,
        remoteId: () => newAsset.remoteId ?? remoteId,
        livePhotoVideoId: newAsset.livePhotoVideoId ?? livePhotoVideoId,
      );
    }

    return copyWith(
      height: height ?? newAsset.height,
      width: width ?? newAsset.width,
      localId: () => localId ?? newAsset.localId,
      remoteId: () => remoteId ?? newAsset.remoteId,
      livePhotoVideoId: livePhotoVideoId ?? newAsset.livePhotoVideoId,
    );
  }

  @override
  String toString() => """
{
  "id": "$id",
  "remoteId": "${remoteId ?? "-"}",
  "localId": "${localId ?? "-"}",
  "name": "$name",
  "hash": "$hash",
  "height": ${height ?? "-"},
  "width": ${width ?? "-"},
  "type": "$type",
  "createdTime": "$createdTime",
  "modifiedTime": "$modifiedTime",
  "duration": "$duration",
  "livePhotoVideoId": "${livePhotoVideoId ?? "-"}",
}""";

  @override
  bool operator ==(covariant Asset other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.hash == hash &&
        other.height == height &&
        other.width == width &&
        other.type == type &&
        other.createdTime == createdTime &&
        other.modifiedTime == modifiedTime &&
        other.duration == duration &&
        other.localId == localId &&
        other.remoteId == remoteId &&
        other.livePhotoVideoId == livePhotoVideoId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        hash.hashCode ^
        height.hashCode ^
        width.hashCode ^
        type.hashCode ^
        createdTime.hashCode ^
        modifiedTime.hashCode ^
        duration.hashCode ^
        localId.hashCode ^
        remoteId.hashCode ^
        livePhotoVideoId.hashCode;
  }

  static int compareByRemoteId(Asset a, Asset b) =>
      CollectionUtil.compareToNullable(a.remoteId, b.remoteId);

  static int compareByLocalId(Asset a, Asset b) =>
      CollectionUtil.compareToNullable(a.localId, b.localId);
}

AssetType _toAssetType(AssetTypeEnum type) => switch (type) {
      AssetTypeEnum.AUDIO => AssetType.audio,
      AssetTypeEnum.IMAGE => AssetType.image,
      AssetTypeEnum.VIDEO => AssetType.video,
      _ => AssetType.other,
    };
