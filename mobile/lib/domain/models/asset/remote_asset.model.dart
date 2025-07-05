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
  final DateTime? localDateTime;
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
    this.localDateTime,
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
    localDateTime: ${localDateTime ?? "<NA>"},
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
        localDateTime == other.localDateTime &&
        visibility == other.visibility;
  }

  @override
  int get hashCode =>
      super.hashCode ^
      id.hashCode ^
      ownerId.hashCode ^
      localId.hashCode ^
      thumbHash.hashCode ^
      localDateTime.hashCode ^
      visibility.hashCode;

  RemoteAsset copyWith({
    String? id,
    String? localId,
    String? name,
    String? ownerId,
    String? checksum,
    AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? width,
    int? height,
    int? durationInSeconds,
    bool? isFavorite,
    String? thumbHash,
    AssetVisibility? visibility,
  }) {
    return RemoteAsset(
      id: id ?? this.id,
      localId: localId ?? this.localId,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      checksum: checksum ?? this.checksum,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      isFavorite: isFavorite ?? this.isFavorite,
      thumbHash: thumbHash ?? this.thumbHash,
      visibility: visibility ?? this.visibility,
    );
  }
}
