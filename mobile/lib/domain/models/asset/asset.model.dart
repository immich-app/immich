part of 'base_asset.model.dart';

class Asset extends BaseAsset {
  final String id;
  final String? localId;

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
  });

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
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! Asset) return false;
    if (identical(this, other)) return true;
    return super == other && id == other.id && localId == other.localId;
  }

  @override
  int get hashCode => super.hashCode ^ id.hashCode ^ localId.hashCode;
}
