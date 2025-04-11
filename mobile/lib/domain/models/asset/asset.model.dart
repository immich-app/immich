part 'local_asset.model.dart';
part 'merged_asset.model.dart';
part 'remote_asset.model.dart';

enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

sealed class Asset {
  final String name;
  final String? checksum;
  final AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationInSeconds;

  const Asset({
    required this.name,
    required this.checksum,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.width,
    this.height,
    this.durationInSeconds,
  });

  @override
  String toString() {
    return '''Asset {
  name: $name,
  type: $type,
  createdAt: $createdAt,
  updatedAt: $updatedAt,
  width: ${width ?? "<NA>"},
  height: ${height ?? "<NA>"},
  durationInSeconds: ${durationInSeconds ?? "<NA>"}
}''';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is Asset) {
      return name == other.name &&
          type == other.type &&
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          width == other.width &&
          height == other.height &&
          durationInSeconds == other.durationInSeconds;
    }
    return false;
  }

  @override
  int get hashCode {
    return name.hashCode ^
        type.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        width.hashCode ^
        height.hashCode ^
        durationInSeconds.hashCode;
  }
}
