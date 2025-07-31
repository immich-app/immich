enum AlbumAssetOrder {
  // do not change this order!
  asc,
  desc,
}

enum AlbumUserRole {
  // do not change this order!
  editor,
  viewer,
}

// Model for an album stored in the server
class RemoteAlbum {
  final String id;
  final String name;
  final String ownerId;
  final String description;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? thumbnailAssetId;
  final bool isActivityEnabled;
  final AlbumAssetOrder order;
  final int assetCount;
  final String ownerName;

  const RemoteAlbum({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.description,
    required this.createdAt,
    required this.updatedAt,
    this.thumbnailAssetId,
    required this.isActivityEnabled,
    required this.order,
    required this.assetCount,
    required this.ownerName,
  });

  @override
  String toString() {
    return '''Album {
    id: $id,
    name: $name,
    ownerId: $ownerId,
    description: $description,
    createdAt: $createdAt,
    updatedAt: $updatedAt,
    isActivityEnabled: $isActivityEnabled,
    order: $order,
    thumbnailAssetId: ${thumbnailAssetId ?? "<NA>"}
    assetCount: $assetCount
    ownerName: $ownerName
 }''';
  }

  @override
  bool operator ==(Object other) {
    if (other is! RemoteAlbum) return false;
    if (identical(this, other)) return true;
    return id == other.id &&
        name == other.name &&
        ownerId == other.ownerId &&
        description == other.description &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        thumbnailAssetId == other.thumbnailAssetId &&
        isActivityEnabled == other.isActivityEnabled &&
        order == other.order &&
        assetCount == other.assetCount &&
        ownerName == other.ownerName;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        ownerId.hashCode ^
        description.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        thumbnailAssetId.hashCode ^
        isActivityEnabled.hashCode ^
        order.hashCode ^
        assetCount.hashCode ^
        ownerName.hashCode;
  }

  RemoteAlbum copyWith({
    String? id,
    String? name,
    String? ownerId,
    String? description,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? thumbnailAssetId,
    bool? isActivityEnabled,
    AlbumAssetOrder? order,
    int? assetCount,
    String? ownerName,
  }) {
    return RemoteAlbum(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      thumbnailAssetId: thumbnailAssetId ?? this.thumbnailAssetId,
      isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
      order: order ?? this.order,
      assetCount: assetCount ?? this.assetCount,
      ownerName: ownerName ?? this.ownerName,
    );
  }
}
