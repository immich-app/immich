part of 'base_album.model.dart';

enum AssetOrder {
  // do not change this order!
  asc,
  desc,
}

// Model for an album stored in the server
class Album extends BaseAlbum {
  final String description;
  final DateTime createdAt;
  final String? thumbnailAssetId;
  final bool isActivityEnabled;
  final AssetOrder order;

  const Album({
    required super.id,
    required super.name,
    required this.description,
    required this.createdAt,
    required super.updatedAt,
    this.thumbnailAssetId,
    required this.isActivityEnabled,
    required this.order,
    super.assetCount = 0,
  });

  @override
  String toString() {
    return '''Album {
   id: $id,
   name: $name,
   description: $description,
   createdAt: $createdAt,
   updatedAt: $updatedAt,
   isActivityEnabled: $isActivityEnabled,
   order: $order,
   thumbnailAssetId: ${thumbnailAssetId ?? "<NA>"}
   assetCount: $assetCount
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! Album) return false;
    if (identical(this, other)) return true;
    return id == other.id &&
        name == other.name &&
        description == other.description &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        thumbnailAssetId == other.thumbnailAssetId &&
        isActivityEnabled == other.isActivityEnabled &&
        order == other.order &&
        assetCount == other.assetCount;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        description.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        thumbnailAssetId.hashCode ^
        isActivityEnabled.hashCode ^
        order.hashCode ^
        assetCount.hashCode;
  }
}
