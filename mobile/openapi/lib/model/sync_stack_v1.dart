// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncStackV1 {
  const SyncStackV1({
    required this.createdAt,
    required this.id,
    required this.ownerId,
    required this.primaryAssetId,
    required this.updatedAt,
  });

  /// Created at
  final DateTime createdAt;

  /// Stack ID
  final String id;

  /// Owner ID
  final String ownerId;

  /// Primary asset ID
  final String primaryAssetId;

  /// Updated at
  final DateTime updatedAt;

  static SyncStackV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncStackV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      id: json[r'id'] as String,
      ownerId: json[r'ownerId'] as String,
      primaryAssetId: json[r'primaryAssetId'] as String,
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'id'] = id;
    json[r'ownerId'] = ownerId;
    json[r'primaryAssetId'] = primaryAssetId;
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  SyncStackV1 copyWith({
    DateTime? createdAt,
    String? id,
    String? ownerId,
    String? primaryAssetId,
    DateTime? updatedAt,
  }) {
    return .new(
      createdAt: createdAt ?? this.createdAt,
      id: id ?? this.id,
      ownerId: ownerId ?? this.ownerId,
      primaryAssetId: primaryAssetId ?? this.primaryAssetId,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncStackV1 &&
            createdAt == other.createdAt &&
            id == other.id &&
            ownerId == other.ownerId &&
            primaryAssetId == other.primaryAssetId &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([createdAt, id, ownerId, primaryAssetId, updatedAt]);
  }

  @override
  String toString() =>
      'SyncStackV1(createdAt=$createdAt, id=$id, ownerId=$ownerId, primaryAssetId=$primaryAssetId, updatedAt=$updatedAt)';
}
