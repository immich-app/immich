part of 'base_asset.model.dart';

enum AssetVisibility {
  timeline,
  hidden,
  archive,
  locked,
}

// Model for an asset stored in the server
class RemoteAsset extends BaseAsset {
  final String id;
  final String? localId;
  final String? thumbHash;
  final AssetVisibility visibility;
  final String ownerId;

  const RemoteAsset({
    required this.id,
    this.localId,
    required super.name,
    required this.ownerId,
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
  String get heroTag => '${localId ?? checksum}_$id';

  @override
  String toString() {
    return '''Asset {
    id: $id,
    name: $name,
    ownerId: $ownerId,
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
    if (other is! RemoteAsset) return false;
    if (identical(this, other)) return true;
    return super == other &&
        id == other.id &&
        ownerId == other.ownerId &&
        localId == other.localId &&
        thumbHash == other.thumbHash &&
        visibility == other.visibility;
  }

  @override
  int get hashCode =>
      super.hashCode ^
      id.hashCode ^
      ownerId.hashCode ^
      localId.hashCode ^
      thumbHash.hashCode ^
      visibility.hashCode;
}
