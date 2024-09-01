enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

class Asset {
  final String name;
  final String checksum;
  final int? height;
  final int? width;
  final AssetType type;
  final DateTime createdTime;
  final DateTime modifiedTime;
  final int duration;

  const Asset({
    required this.name,
    required this.checksum,
    this.height,
    this.width,
    required this.type,
    required this.createdTime,
    required this.modifiedTime,
    required this.duration,
  });

  Asset copyWith({
    String? name,
    String? checksum,
    int? height,
    int? width,
    AssetType? type,
    DateTime? createdTime,
    DateTime? modifiedTime,
    int? duration,
  }) {
    return Asset(
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      height: height ?? this.height,
      width: width ?? this.width,
      type: type ?? this.type,
      createdTime: createdTime ?? this.createdTime,
      modifiedTime: modifiedTime ?? this.modifiedTime,
      duration: duration ?? this.duration,
    );
  }

  @override
  String toString() => """
{
  "name": "$name",
  "checksum": "$checksum",
  "height": ${height ?? "-"},
  "width": ${width ?? "-"},
  "type": "$type",
  "createdTime": "$createdTime",
  "modifiedTime": "$modifiedTime",
  "duration": "$duration",
}""";

  @override
  bool operator ==(covariant Asset other) {
    if (identical(this, other)) return true;

    return other.name == name &&
        other.checksum == checksum &&
        other.height == height &&
        other.width == width &&
        other.type == type &&
        other.createdTime == createdTime &&
        other.modifiedTime == modifiedTime &&
        other.duration == duration;
  }

  @override
  int get hashCode {
    return name.hashCode ^
        checksum.hashCode ^
        height.hashCode ^
        width.hashCode ^
        type.hashCode ^
        createdTime.hashCode ^
        modifiedTime.hashCode ^
        duration.hashCode;
  }
}
