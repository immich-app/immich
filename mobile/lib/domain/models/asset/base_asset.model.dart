part 'asset.model.dart';
part 'local_asset.model.dart';

enum AssetType {
  // do not change this order!
  other,
  image,
  video,
  audio,
}

enum AssetState {
  local,
  remote,
  merged,
}

sealed class BaseAsset {
  final String name;
  final String? checksum;
  final AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? width;
  final int? height;
  final int? durationInSeconds;
  final bool isFavorite;

  const BaseAsset({
    required this.name,
    required this.checksum,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.width,
    this.height,
    this.durationInSeconds,
    this.isFavorite = false,
  });

  bool get isImage => type == AssetType.image;
  bool get isVideo => type == AssetType.video;
  AssetState get storage;

  @override
  String toString() {
    return '''BaseAsset {
  name: $name,
  type: $type,
  createdAt: $createdAt,
  updatedAt: $updatedAt,
  width: ${width ?? "<NA>"},
  height: ${height ?? "<NA>"},
  durationInSeconds: ${durationInSeconds ?? "<NA>"},
  isFavorite: $isFavorite,
}''';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is BaseAsset) {
      return name == other.name &&
          type == other.type &&
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          width == other.width &&
          height == other.height &&
          durationInSeconds == other.durationInSeconds &&
          isFavorite == other.isFavorite;
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
        durationInSeconds.hashCode ^
        isFavorite.hashCode;
  }
}
