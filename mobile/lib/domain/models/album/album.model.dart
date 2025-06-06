enum AssetOrder {
  // do not change this order!
  asc,
  desc,
}

// Model for an album stored in the server
class Album {
  final String id;
  final String name;
  final String description;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? thumbnailAssetId;
  final bool isActivityEnabled;
  final AssetOrder order;

  const Album({
    required this.id,
    required this.name,
    required this.description,
    required this.createdAt,
    required this.updatedAt,
    this.thumbnailAssetId,
    required this.isActivityEnabled,
    required this.order,
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
        order == other.order;
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
        order.hashCode;
  }
}
