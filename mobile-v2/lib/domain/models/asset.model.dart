import 'package:flutter/foundation.dart';

enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

@immutable
class LocalAsset {
  final int id;
  final String localId;
  final String name;
  final String checksum;
  final int height;
  final int width;
  final AssetType type;
  final DateTime createdTime;
  final DateTime modifiedTime;
  final int duration;
  final bool isLivePhoto;

  const LocalAsset({
    required this.id,
    required this.localId,
    required this.name,
    required this.checksum,
    required this.height,
    required this.width,
    required this.type,
    required this.createdTime,
    required this.modifiedTime,
    required this.duration,
    required this.isLivePhoto,
  });

  @override
  String toString() {
    return 'LocalAsset(id: $id, localId: $localId, name: $name, checksum: $checksum, height: $height, width: $width, type: $type, createdTime: $createdTime, modifiedTime: $modifiedTime, duration: $duration, isLivePhoto: $isLivePhoto)';
  }

  String toJSON() {
    return """
{
  "id": $id,
  "localId": "$localId",
  "name": "$name",
  "checksum": "$checksum",
  "height": $height,
  "width": $width,
  "type": "$type",
  "createdTime": "$createdTime",
  "modifiedTime": "$modifiedTime",
  "duration": "$duration",
  "isLivePhoto": "$isLivePhoto",
}""";
  }

  @override
  bool operator ==(covariant LocalAsset other) {
    if (identical(this, other)) return true;

    return other.hashCode == hashCode;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        localId.hashCode ^
        name.hashCode ^
        checksum.hashCode ^
        height.hashCode ^
        width.hashCode ^
        type.hashCode ^
        createdTime.hashCode ^
        modifiedTime.hashCode ^
        duration.hashCode ^
        isLivePhoto.hashCode;
  }
}
