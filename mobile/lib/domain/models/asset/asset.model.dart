part of 'base_asset.model.dart';

enum AssetVisibility {
  timeline,
  hidden,
  archive,
  locked,
}

// Model for an asset stored in the server
class Asset extends BaseAsset {
  final String id;
  final String? localId;
  final String? thumbHash;
  final AssetVisibility visibility;

  const Asset({
    required this.id,
    this.localId,
    required super.name,
    required super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    super.width,
    super.height,
    super.durationInSeconds,
    super.isFavorite = false,
    this.thumbHash,
    this.visibility = AssetVisibility.timeline,
  });

  @override
  AssetState get storage =>
      localId == null ? AssetState.remote : AssetState.merged;

  @override
  String toString() {
    return '''Asset {
   id: $id,
   name: $name,
   type: $type,
   createdAt: $createdAt,
   updatedAt: $updatedAt,
   width: ${width ?? "<NA>"},
   height: ${height ?? "<NA>"},
   durationInSeconds: ${durationInSeconds ?? "<NA>"},
   localId: ${localId ?? "<NA>"},
   isFavorite: $isFavorite,
    thumbHash: ${thumbHash ?? "<NA>"},
    visibility: $visibility,
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! Asset) return false;
    if (identical(this, other)) return true;
    return super == other &&
        id == other.id &&
        localId == other.localId &&
        thumbHash == other.thumbHash &&
        visibility == other.visibility;
  }

  @override
  int get hashCode =>
      super.hashCode ^
      id.hashCode ^
      localId.hashCode ^
      thumbHash.hashCode ^
      visibility.hashCode;
}
