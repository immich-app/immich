part of 'base_asset.model.dart';

class LocalAsset extends BaseAsset {
  final String id;
  final String? remoteId;

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
  });

  @override
  AssetState get storage =>
      remoteId == null ? AssetState.local : AssetState.merged;

  bool get hasRemote => remoteId != null;

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
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! LocalAsset) return false;
    if (identical(this, other)) return true;
    return super == other && id == other.id && remoteId == other.remoteId;
  }

  @override
  int get hashCode => super.hashCode ^ id.hashCode ^ remoteId.hashCode;

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
    );
  }
}
