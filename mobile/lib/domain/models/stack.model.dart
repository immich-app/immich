// Model for a stack stored in the server
class Stack {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String ownerId;
  final String primaryAssetId;

  const Stack({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.ownerId,
    required this.primaryAssetId,
  });

  Stack copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? ownerId,
    String? primaryAssetId,
  }) {
    return Stack(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      ownerId: ownerId ?? this.ownerId,
      primaryAssetId: primaryAssetId ?? this.primaryAssetId,
    );
  }

  @override
  String toString() {
    return '''Stack {
    id: $id,
    createdAt: $createdAt,
    updatedAt: $updatedAt,
    ownerId: $ownerId,
    primaryAssetId: $primaryAssetId
}''';
  }

  @override
  bool operator ==(covariant Stack other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.ownerId == ownerId &&
        other.primaryAssetId == primaryAssetId;
  }

  @override
  int get hashCode {
    return id.hashCode ^ createdAt.hashCode ^ updatedAt.hashCode ^ ownerId.hashCode ^ primaryAssetId.hashCode;
  }
}

class StackResponse {
  final String id;
  final String primaryAssetId;
  final List<String> assetIds;

  const StackResponse({
    required this.id,
    required this.primaryAssetId,
    required this.assetIds,
  });

  @override
  bool operator ==(covariant StackResponse other) {
    if (identical(this, other)) return true;

    return other.id == id && other.primaryAssetId == primaryAssetId && other.assetIds == assetIds;
  }

  @override
  int get hashCode => id.hashCode ^ primaryAssetId.hashCode ^ assetIds.hashCode;
}
