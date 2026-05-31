// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAlbumV2 {
  const SyncAlbumV2({
    required this.createdAt,
    required this.description,
    required this.id,
    required this.isActivityEnabled,
    required this.name,
    required this.order,
    required this.thumbnailAssetId,
    required this.updatedAt,
  });

  /// Created at
  final DateTime createdAt;

  /// Album description
  final String description;

  /// Album ID
  final String id;

  /// Is activity enabled
  final bool isActivityEnabled;

  /// Album name
  final String name;

  final AssetOrder order;

  /// Thumbnail asset ID
  final String? thumbnailAssetId;

  /// Updated at
  final DateTime updatedAt;

  static const _undefined = Object();

  static SyncAlbumV2? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAlbumV2>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      description: json[r'description'] as String,
      id: json[r'id'] as String,
      isActivityEnabled: json[r'isActivityEnabled'] as bool,
      name: json[r'name'] as String,
      order: (AssetOrder.fromJson(json[r'order']))!,
      thumbnailAssetId: (json[r'thumbnailAssetId'] as String?),
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'description'] = description;
    json[r'id'] = id;
    json[r'isActivityEnabled'] = isActivityEnabled;
    json[r'name'] = name;
    json[r'order'] = order.toJson();
    if (thumbnailAssetId != null) {
      json[r'thumbnailAssetId'] = thumbnailAssetId!;
    }
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  SyncAlbumV2 copyWith({
    DateTime? createdAt,
    String? description,
    String? id,
    bool? isActivityEnabled,
    String? name,
    AssetOrder? order,
    Object? thumbnailAssetId = _undefined,
    DateTime? updatedAt,
  }) {
    return .new(
      createdAt: createdAt ?? this.createdAt,
      description: description ?? this.description,
      id: id ?? this.id,
      isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
      name: name ?? this.name,
      order: order ?? this.order,
      thumbnailAssetId: identical(thumbnailAssetId, _undefined) ? this.thumbnailAssetId : thumbnailAssetId as String?,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAlbumV2 &&
            createdAt == other.createdAt &&
            description == other.description &&
            id == other.id &&
            isActivityEnabled == other.isActivityEnabled &&
            name == other.name &&
            order == other.order &&
            thumbnailAssetId == other.thumbnailAssetId &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([createdAt, description, id, isActivityEnabled, name, order, thumbnailAssetId, updatedAt]);
  }

  @override
  String toString() =>
      'SyncAlbumV2(createdAt=$createdAt, description=$description, id=$id, isActivityEnabled=$isActivityEnabled, name=$name, order=$order, thumbnailAssetId=$thumbnailAssetId, updatedAt=$updatedAt)';
}
