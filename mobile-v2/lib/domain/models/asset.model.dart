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
  final String checksum;
  final int height;
  final int width;
  final AssetType type;
  final DateTime createdTime;
  final DateTime modifiedTime;
  final int duration;
  final bool isLivePhoto;

  const Asset({
    required this.id,
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

  Asset copyWith({
    int? id,
    String? name,
    String? checksum,
    int? height,
    int? width,
    AssetType? type,
    DateTime? createdTime,
    DateTime? modifiedTime,
    int? duration,
    bool? isLivePhoto,
  }) {
    return Asset(
      id: id ?? this.id,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      height: height ?? this.height,
      width: width ?? this.width,
      type: type ?? this.type,
      createdTime: createdTime ?? this.createdTime,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      duration: duration ?? this.duration,
      isLivePhoto: isLivePhoto ?? this.isLivePhoto,
    );
  }

  @override
  String toString() => """
{
  "id": $id,
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

  @override
  bool operator ==(covariant Asset other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.checksum == checksum &&
        other.height == height &&
        other.width == width &&
        other.type == type &&
        other.createdTime == createdTime &&
        other.modifiedTime == modifiedTime &&
        other.duration == duration &&
        other.isLivePhoto == isLivePhoto;
  }

  @override
  int get hashCode {
    return id.hashCode ^
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
