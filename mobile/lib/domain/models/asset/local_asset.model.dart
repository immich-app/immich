part of 'base_asset.model.dart';

class LocalAsset extends BaseAsset {
  final String id;
  final String? remoteId;
  final int orientation;

  const LocalAsset({
    required this.id,
    this.remoteId,
    required super.name,
    super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    super.width,
    super.height,
    super.durationInSeconds,
    super.isFavorite = false,
    super.livePhotoVideoId,
    this.orientation = 0,
  });

  @override
  AssetState get storage =>
      remoteId == null ? AssetState.local : AssetState.merged;

  @override
  String get heroTag => '${id}_${remoteId ?? checksum}';

  @override
  String toString() {
    return '''LocalAsset {
   id: $id,
   name: $name,
   type: $type,
   createdAt: $createdAt,
   updatedAt: $updatedAt,
   width: ${width ?? "<NA>"},
   height: ${height ?? "<NA>"},
   durationInSeconds: ${durationInSeconds ?? "<NA>"},
   remoteId: ${remoteId ?? "<NA>"}
   isFavorite: $isFavorite,
  orientation: $orientation,
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! LocalAsset) return false;
    if (identical(this, other)) return true;
    return super == other && id == other.id && orientation == other.orientation;
  }

  @override
  int get hashCode =>
      super.hashCode ^ id.hashCode ^ remoteId.hashCode ^ orientation.hashCode;

  LocalAsset copyWith({
    String? id,
    String? remoteId,
    String? name,
    String? checksum,
    AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? width,
    int? height,
    int? durationInSeconds,
    bool? isFavorite,
    int? orientation,
  }) {
    return LocalAsset(
      id: id ?? this.id,
      remoteId: remoteId ?? this.remoteId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      isFavorite: isFavorite ?? this.isFavorite,
      orientation: orientation ?? this.orientation,
    );
  }
}
